import hashlib
import random
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from apps.locations.models import Country, City, Station
from apps.operators.models import Operator
from apps.vehicles.models import Vehicle, Seat, VehicleType
from apps.routes.models import Route
from apps.trips.models import Trip, TripStatus
from apps.bookings.models import Booking, BookingPassenger, BookingStatus, PaymentStatus
from apps.tickets.models import DigitalTicket
from apps.tickets.generator import generate_qr_for_ticket

# Known real-world road and rail distances (km) and travel durations (minutes)
KNOWN_DISTANCES = {
    ("lahore", "islamabad"): (375, 270),
    ("islamabad", "lahore"): (375, 270),
    ("karachi", "lahore"): (1210, 960),
    ("lahore", "karachi"): (1210, 960),
    ("islamabad", "peshawar"): (185, 135),
    ("peshawar", "islamabad"): (185, 135),
    ("islamabad", "murree"): (65, 75),
    ("murree", "islamabad"): (65, 75),
    ("lahore", "faisalabad"): (180, 120),
    ("faisalabad", "lahore"): (180, 120),
    ("lahore", "multan"): (345, 255),
    ("multan", "lahore"): (345, 255),
    ("karachi", "islamabad"): (1410, 1080),
    ("islamabad", "karachi"): (1410, 1080),
    ("karachi", "hyderabad"): (160, 135),
    ("hyderabad", "karachi"): (160, 135),
    ("karachi", "quetta"): (690, 600),
    ("quetta", "karachi"): (690, 600),
    ("karachi", "gwadar"): (630, 510),
    ("gwadar", "karachi"): (630, 510),
    ("quetta", "islamabad"): (890, 780),
    ("islamabad", "quetta"): (890, 780),
    ("rawalpindi", "gilgit"): (510, 660),
    ("gilgit", "rawalpindi"): (510, 660),
    ("islamabad", "skardu"): (640, 780),
    ("skardu", "islamabad"): (640, 780),
    ("peshawar", "swat"): (160, 150),
    ("swat", "peshawar"): (160, 150),
    ("lahore", "sialkot"): (135, 110),
    ("sialkot", "lahore"): (135, 110),
    ("lahore", "gujranwala"): (75, 65),
    ("gujranwala", "lahore"): (75, 65),
    ("multan", "bahawalpur"): (95, 80),
    ("bahawalpur", "multan"): (95, 80),
    ("lahore", "rawalpindi"): (360, 260),
    ("rawalpindi", "lahore"): (360, 260),
    ("islamabad", "abbottabad"): (120, 110),
    ("abbottabad", "islamabad"): (120, 110),
    # Additional Pakistan Inter-City Routes
    ("peshawar", "mardan"): (65, 55),
    ("mardan", "peshawar"): (65, 55),
    ("quetta", "ziarat"): (125, 120),
    ("ziarat", "quetta"): (125, 120),
    ("karachi", "sukkur"): (480, 360),
    ("sukkur", "karachi"): (480, 360),
    ("lahore", "sahiwal"): (175, 130),
    ("sahiwal", "lahore"): (175, 130),
}

def estimate_distance_and_duration(origin_name: str, dest_name: str):
    """
    Returns (distance_km, duration_minutes) for any origin and destination in Pakistan.
    """
    key = (origin_name.strip().lower(), dest_name.strip().lower())
    if key in KNOWN_DISTANCES:
        return KNOWN_DISTANCES[key]

    # Deterministic estimate based on name hashes so same city pair always yields identical distance
    combined = f"{sorted([origin_name.lower(), dest_name.lower()])}"
    h = int(hashlib.md5(combined.encode('utf-8')).hexdigest()[:8], 16)
    
    # Realistic intercity highway distance between 95 km and 880 km
    distance_km = 95 + (h % 785)
    
    # Duration based on ~80 km/h highway speed + 20 mins buffer
    duration_minutes = int((distance_km / 80.0) * 60) + 20
    return distance_km, duration_minutes

def calculate_rent(distance_km: float) -> Decimal:
    """
    Calculates realistic ticket rent (fare) in PKR based on distance.
    """
    if distance_km <= 80:
        base = 500 + (distance_km * 9.0)
    elif distance_km <= 250:
        base = 500 + (distance_km * 6.5)
    elif distance_km <= 500:
        base = 500 + (distance_km * 5.2)
    else:
        base = 500 + (distance_km * 3.6)

    # Round to nearest Rs. 50
    rounded = round(base / 50.0) * 50
    return Decimal(str(max(600, int(rounded))))

@transaction.atomic
def create_custom_journey_booking(
    origin_city_name: str,
    dest_city_name: str,
    passenger_name: str = "Muhammad Ali",
    seat_number: str = "1A",
    departure_datetime: datetime = None,
    user = None,
    contact_email: str = "passenger@apextravel.com",
    contact_phone: str = "+92 300 1234567"
):
    """
    Creates a confirmed booking with visual route, distance meter, and arrival time for any journey written by user.
    """
    origin_clean = origin_city_name.strip().title()
    dest_clean = dest_city_name.strip().title()

    if not origin_clean or not dest_clean:
        raise ValueError("Origin and destination cities cannot be empty.")

    if origin_clean.lower() == dest_clean.lower():
        dest_clean = f"{dest_clean} Express Terminal"

    distance_km, duration_minutes = estimate_distance_and_duration(origin_clean, dest_clean)
    rent = calculate_rent(distance_km)

    # Resolve departure and arrival times
    now = timezone.now()
    if not departure_datetime or departure_datetime <= now:
        departure_datetime = now + timedelta(hours=2)

    arrival_datetime = departure_datetime + timedelta(minutes=duration_minutes)

    # 1. Country & Cities
    country, _ = Country.objects.get_or_create(code="PK", defaults={"name": "Pakistan"})
    orig_city, _ = City.objects.get_or_create(
        country=country, name=origin_clean,
        defaults={"is_popular": True}
    )
    dest_city, _ = City.objects.get_or_create(
        country=country, name=dest_clean,
        defaults={"is_popular": True}
    )

    # 2. Terminals / Stations
    orig_station, _ = Station.objects.get_or_create(
        city=orig_city,
        code=f"{origin_clean[:3].upper()}-MAIN"[:20],
        defaults={"name": f"{origin_clean} Express Terminal", "address": f"Main Terminal Stand, {origin_clean}"}
    )
    dest_station, _ = Station.objects.get_or_create(
        city=dest_city,
        code=f"{dest_clean[:3].upper()}-MAIN"[:20],
        defaults={"name": f"{dest_clean} Central Terminal", "address": f"City Terminal Center, {dest_clean}"}
    )

    # 3. Route
    route, _ = Route.objects.get_or_create(
        origin_city=orig_city,
        destination_city=dest_city,
        origin_station=orig_station,
        destination_station=dest_station,
        defaults={
            "distance_km": Decimal(str(distance_km)),
            "estimated_duration_minutes": duration_minutes,
            "is_popular": True,
            "is_active": True
        }
    )
    # Ensure route distance is accurate
    if route.distance_km != Decimal(str(distance_km)):
        route.distance_km = Decimal(str(distance_km))
        route.estimated_duration_minutes = duration_minutes
        route.save()

    # 4. Operator
    operator, _ = Operator.objects.get_or_create(
        code="DEX",
        defaults={
            "name": "Daewoo Express Pakistan",
            "contact_phone": "+92 42 111 007 008",
            "contact_email": "customercare@daewoo.com.pk",
            "rating": Decimal("4.9"),
            "is_active": True,
            "cancellation_policy": "Full refund up to 12 hours before departure; 50% refund thereafter."
        }
    )

    # 5. Vehicle & Seats
    vehicle, _ = Vehicle.objects.get_or_create(
        operator=operator,
        vehicle_number="PK-VIP-2026",
        defaults={
            "model_name": "Daewoo Grand Royale Luxury Bus",
            "vehicle_type": VehicleType.BUS,
            "total_rows": 10,
            "seats_per_row": 4,
            "amenities": ["WiFi", "AC", "Reclining Seats", "Complimentary Refreshments", "Mobile Charger"]
        }
    )

    # Ensure seat exists
    seat_clean = (seat_number or "1A").strip().upper()
    col_char = seat_clean[-1] if seat_clean and seat_clean[-1].isalpha() else 'A'
    col_idx = max(1, ord(col_char) - ord('A') + 1)
    row_part = seat_clean[:-1] if seat_clean and seat_clean[-1].isalpha() else seat_clean
    row_num = int(row_part) if row_part.isdigit() else 1
    seat, _ = Seat.objects.get_or_create(
        vehicle=vehicle,
        seat_number=seat_clean,
        defaults={"row": row_num, "column": col_idx, "price_multiplier": Decimal("1.00")}
    )

    # 6. Trip
    trip, _ = Trip.objects.get_or_create(
        route=route,
        operator=operator,
        vehicle=vehicle,
        departure_time=departure_datetime,
        defaults={
            "arrival_time": arrival_datetime,
            "base_price": rent,
            "status": TripStatus.SCHEDULED,
            "is_featured": True
        }
    )

    # 7. Generate Unique PNR Reference
    prefix_orig = origin_clean[:3].upper()
    prefix_dest = dest_clean[:3].upper()
    rnd_suffix = random.randint(1000, 9999)
    pnr_ref = f"PK-{prefix_orig}-{prefix_dest}-{rnd_suffix}"

    while Booking.objects.filter(booking_reference=pnr_ref).exists():
        rnd_suffix = random.randint(1000, 9999)
        pnr_ref = f"PK-{prefix_orig}-{prefix_dest}-{rnd_suffix}"

    # 8. Create Booking
    from apps.accounts.models import User
    booking_user = user if user and user.is_authenticated else (User.objects.filter(is_staff=True).first() or User.objects.first())
    booking = Booking.objects.create(
        user=booking_user,
        trip=trip,
        booking_reference=pnr_ref,
        contact_email=contact_email,
        contact_phone=contact_phone,
        total_passengers=1,
        subtotal_amount=rent,
        final_amount=rent,
        status=BookingStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID
    )

    # 9. Create Passenger Record
    tkt_num = f"TKT-{prefix_orig}{prefix_dest}-{random.randint(10000, 99999)}"
    passenger = BookingPassenger.objects.create(
        booking=booking,
        seat=seat,
        full_name=passenger_name or "Muhammad Ali",
        id_card_number="35201-9876543-1",
        seat_number=seat_clean,
        price=rent,
        ticket_number=tkt_num
    )

    # 10. Generate DigitalTicket with QR Code
    digital_ticket = DigitalTicket.objects.create(
        booking=booking,
        passenger=passenger,
        ticket_code=tkt_num
    )
    generate_qr_for_ticket(digital_ticket)

    return {
        "booking": booking,
        "trip": trip,
        "route": route,
        "passenger": passenger,
        "digital_ticket": digital_ticket,
        "distance_km": float(distance_km),
        "duration_minutes": duration_minutes,
        "duration_formatted": route.duration_formatted,
        "rent": float(rent),
        "booking_reference": pnr_ref,
        "departure_time": departure_datetime.isoformat(),
        "arrival_time": arrival_datetime.isoformat(),
        "origin_city": origin_clean,
        "destination_city": dest_clean,
        "origin_station": orig_station.name,
        "destination_station": dest_station.name,
        "passenger_name": passenger.full_name,
        "seat_number": seat_clean,
        "ticket_number": tkt_num,
        "qr_data": digital_ticket.qr_data,
        "ticket_url": f"/ticket/{pnr_ref}",
        "print_url": f"/ticket/{pnr_ref}/",
        "pdf_url": f"/api/tickets/download-pdf/{pnr_ref}/"
    }
