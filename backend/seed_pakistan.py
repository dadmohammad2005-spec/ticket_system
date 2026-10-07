import os
import django
from datetime import timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.locations.models import Country, City, Station
from apps.operators.models import Operator
from apps.vehicles.models import Vehicle, VehicleType, Seat
from apps.routes.models import Route
from apps.trips.models import Trip, TripStatus
from apps.bookings.models import Booking, BookingPassenger, BookingStatus, PaymentStatus
from apps.tickets.models import DigitalTicket
from apps.tickets.generator import generate_qr_for_ticket

User = get_user_model()

print("Seeding Pakistan Transportation Network...")

# 1. Country & Cities
pk, _ = Country.objects.get_or_create(name='Pakistan', code='PK')

cities_data = [
    (pk, 'Lahore', 'Punjab', 'LHE', 'https://images.unsplash.com/photo-1596706037042-302324203649?auto=format&fit=crop&w=600&q=80', True),
    (pk, 'Islamabad', 'Federal Capital', 'ISB', 'https://images.unsplash.com/photo-1608670831627-c1d0446e1627?auto=format&fit=crop&w=600&q=80', True),
    (pk, 'Rawalpindi', 'Punjab', 'RWP', 'https://images.unsplash.com/photo-1620063493132-c5da15be6228?auto=format&fit=crop&w=600&q=80', True),
    (pk, 'Karachi', 'Sindh', 'KHI', 'https://images.unsplash.com/photo-1572979267156-f2868ff16e37?auto=format&fit=crop&w=600&q=80', True),
    (pk, 'Peshawar', 'KPK', 'PEW', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80', True),
    (pk, 'Faisalabad', 'Punjab', 'FSD', 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80', True),
    (pk, 'Multan', 'Punjab', 'MUX', 'https://images.unsplash.com/photo-1596706037042-302324203649?auto=format&fit=crop&w=600&q=80', True),
    (pk, 'Murree', 'Punjab', 'MUR', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', True),
]

city_objs = {}
for country, name, state, code, img, is_pop in cities_data:
    c, _ = City.objects.get_or_create(
        country=country, name=name,
        defaults={'state_province': state, 'code': code, 'image_url': img, 'is_popular': is_pop}
    )
    city_objs[name] = c

# 2. Stations
stations_data = [
    (city_objs['Lahore'], 'Thokar Niaz Baig Daewoo Terminal, Lahore', 'LHE-THK', 'Multan Rd, Thokar Niaz Baig, Lahore'),
    (city_objs['Lahore'], 'Kalma Chowk Faisal Movers Terminal, Lahore', 'LHE-KLM', 'Main Ferozepur Rd, Kalma Chowk, Lahore'),
    (city_objs['Lahore'], 'Lahore Cantt Railway Station', 'LHE-RAIL', 'Cantt, Lahore'),
    (city_objs['Islamabad'], 'Faizabad Terminal, Islamabad', 'ISB-FZB', 'Faizabad Interchange, Islamabad/Rawalpindi'),
    (city_objs['Islamabad'], 'Motorway M-2 Toll Executive Terminal, Islamabad', 'ISB-M2', 'Kashmir Highway / M-2 Interchange, Islamabad'),
    (city_objs['Islamabad'], 'Margalla Railway Station, Islamabad', 'ISB-RAIL', 'Sector H-9, Islamabad'),
    (city_objs['Karachi'], 'Sohrab Goth Terminal, Karachi', 'KHI-SHR', 'Super Highway, Sohrab Goth, Karachi'),
    (city_objs['Peshawar'], 'General Bus Stand, Peshawar', 'PEW-GBS', 'GT Road, Peshawar'),
    (city_objs['Multan'], 'Chungi No. 9 Terminal, Multan', 'MUX-CH9', 'Khanewal Rd, Multan'),
    (city_objs['Faisalabad'], 'Kohinoor City Terminal, Faisalabad', 'FSD-KOH', 'Jaranwala Rd, Faisalabad'),
    (city_objs['Murree'], 'Mall Road Bus Station, Murree', 'MUR-MAL', 'Mall Road, Murree Hills'),
]

station_objs = {}
for city, s_name, s_code, addr in stations_data:
    st, _ = Station.objects.get_or_create(
        city=city, name=s_name,
        defaults={'code': s_code, 'address': addr, 'is_active': True}
    )
    station_objs[s_name] = st

# 3. Operators
operators_data = [
    ('Daewoo Express Pakistan', 'DEX', 'support@daewoo.com.pk', '+92 42 111-007-008', Decimal('4.85'), 'Strict 2-hour cancellation notice required. 10% processing fee applies.'),
    ('Faisal Movers Luxury', 'FML', 'info@faisalmovers.com', '+92 42 111-22-44-88', Decimal('4.80'), 'Tickets cancellable up to 3 hours prior to departure for 90% refund.'),
    ('Green Line Rail Pakistan', 'GLR', 'help@pakrail.gov.pk', '+92 51 117', Decimal('4.90'), 'Full refund up to 24 hours prior. 50% refund within 12 hours.'),
    ('Road Master Executive', 'RME', 'care@roadmaster.pk', '+92 300 000-0000', Decimal('4.75'), 'Standard operator cancellation policy applies.')
]

operator_objs = {}
for op_name, op_code, op_email, op_phone, op_rating, op_policy in operators_data:
    op, _ = Operator.objects.get_or_create(
        code=op_code,
        defaults={
            'name': op_name,
            'contact_email': op_email,
            'contact_phone': op_phone,
            'rating': op_rating,
            'cancellation_policy': op_policy,
            'is_verified': True
        }
    )
    operator_objs[op_code] = op

# 4. Vehicles
vehicles_data = [
    (operator_objs['DEX'], 'Yutong Master Super Luxury', 'DEX-786', VehicleType.BUS, 40, 10, 4),
    (operator_objs['FML'], 'Scania Business Class Suite', 'FML-992', VehicleType.BUS, 30, 10, 3),
    (operator_objs['GLR'], 'Green Line AC Sleeper Express', 'GLR-01', VehicleType.TRAIN, 48, 12, 4),
    (operator_objs['RME'], 'Volvo Grand Executive Coach', 'RME-108', VehicleType.BUS, 36, 9, 4),
]

vehicle_objs = {}
for op, v_model, v_num, v_type, t_seats, t_rows, s_row in vehicles_data:
    veh, created = Vehicle.objects.get_or_create(
        vehicle_number=v_num,
        defaults={
            'operator': op,
            'model_name': v_model,
            'vehicle_type': v_type,
            'total_seats': t_seats,
            'total_rows': t_rows,
            'seats_per_row': s_row,
            'amenities': ['High-Speed WiFi', 'Reclining Sleeper Seats', 'USB Fast Charging', 'Refreshment Box', 'Air Conditioning', 'LED Entertainment Screen'],
            'is_active': True
        }
    )
    if created or veh.seats.count() == 0:
        veh.generate_default_seats()
    vehicle_objs[v_num] = veh

# 5. Pakistan Routes (Exact Kilometers and Travel Times)
routes_data = [
    (city_objs['Lahore'], city_objs['Islamabad'], station_objs['Thokar Niaz Baig Daewoo Terminal, Lahore'], station_objs['Faizabad Terminal, Islamabad'], Decimal('375.00'), 270, True),
    (city_objs['Islamabad'], city_objs['Lahore'], station_objs['Faizabad Terminal, Islamabad'], station_objs['Thokar Niaz Baig Daewoo Terminal, Lahore'], Decimal('375.00'), 270, True),
    (city_objs['Lahore'], city_objs['Karachi'], station_objs['Thokar Niaz Baig Daewoo Terminal, Lahore'], station_objs['Sohrab Goth Terminal, Karachi'], Decimal('1210.00'), 960, True),
    (city_objs['Karachi'], city_objs['Lahore'], station_objs['Sohrab Goth Terminal, Karachi'], station_objs['Thokar Niaz Baig Daewoo Terminal, Lahore'], Decimal('1210.00'), 960, True),
    (city_objs['Islamabad'], city_objs['Peshawar'], station_objs['Faizabad Terminal, Islamabad'], station_objs['General Bus Stand, Peshawar'], Decimal('185.00'), 135, True),
    (city_objs['Peshawar'], city_objs['Islamabad'], station_objs['General Bus Stand, Peshawar'], station_objs['Faizabad Terminal, Islamabad'], Decimal('185.00'), 135, True),
    (city_objs['Lahore'], city_objs['Faisalabad'], station_objs['Kalma Chowk Faisal Movers Terminal, Lahore'], station_objs['Kohinoor City Terminal, Faisalabad'], Decimal('180.00'), 120, True),
    (city_objs['Islamabad'], city_objs['Murree'], station_objs['Faizabad Terminal, Islamabad'], station_objs['Mall Road Bus Station, Murree'], Decimal('65.00'), 75, True),
    (city_objs['Lahore'], city_objs['Multan'], station_objs['Thokar Niaz Baig Daewoo Terminal, Lahore'], station_objs['Chungi No. 9 Terminal, Multan'], Decimal('345.00'), 240, True),
]

route_objs = []
for orig, dest, o_st, d_st, dist, dur, is_pop in routes_data:
    r, _ = Route.objects.get_or_create(
        origin_city=orig, destination_city=dest,
        origin_station=o_st, destination_station=d_st,
        defaults={
            'distance_km': dist,
            'estimated_duration_minutes': dur,
            'is_popular': is_pop,
            'is_active': True
        }
    )
    route_objs.append(r)

print(f"Created {len(route_objs)} Pakistan Routes.")

# 6. Generate Trips for Next 14 Days
now = timezone.now()
created_trips_count = 0

fares = {
    ('Lahore', 'Islamabad'): Decimal('2400.00'),
    ('Islamabad', 'Lahore'): Decimal('2400.00'),
    ('Lahore', 'Karachi'): Decimal('4800.00'),
    ('Karachi', 'Lahore'): Decimal('4800.00'),
    ('Islamabad', 'Peshawar'): Decimal('1600.00'),
    ('Peshawar', 'Islamabad'): Decimal('1600.00'),
    ('Lahore', 'Faisalabad'): Decimal('1400.00'),
    ('Islamabad', 'Murree'): Decimal('1100.00'),
    ('Lahore', 'Multan'): Decimal('2200.00'),
}

schedule_hours = [
    (7, 30), (9, 0), (11, 30), (14, 0), (16, 30), (18, 0), (20, 30), (23, 0)
]

for day_offset in range(14):
    trip_date = now.date() + timedelta(days=day_offset)
    
    for r in route_objs:
        fare = fares.get((r.origin_city.name, r.destination_city.name), Decimal('2000.00'))
        
        # Select vehicle and operator
        if 'Karachi' in [r.origin_city.name, r.destination_city.name]:
            veh = vehicle_objs['GLR-01']
            op = operator_objs['GLR']
        elif 'Faisalabad' in [r.origin_city.name, r.destination_city.name]:
            veh = vehicle_objs['FML-992']
            op = operator_objs['FML']
        else:
            veh = vehicle_objs['DEX-786']
            op = operator_objs['DEX']
        
        # Schedule 2 trips per day per route
        for hr, minute in [(8, 30), (15, 0), (21, 30)]:
            dep_dt = timezone.datetime.combine(trip_date, timezone.datetime.min.time(), tzinfo=timezone.get_current_timezone()) + timedelta(hours=hr, minutes=minute)
            arr_dt = dep_dt + timedelta(minutes=r.estimated_duration_minutes)
            
            t, created = Trip.objects.get_or_create(
                route=r,
                departure_time=dep_dt,
                defaults={
                    'operator': op,
                    'vehicle': veh,
                    'arrival_time': arr_dt,
                    'base_price': fare,
                    'status': TripStatus.SCHEDULED,
                    'is_featured': True
                }
            )
            if created:
                created_trips_count += 1

print(f"Created {created_trips_count} scheduled Pakistan trips.")

# 7. Seed Confirmed Pakistan Demo Bookings
customer_user = User.objects.filter(role='CUSTOMER').first() or User.objects.first()

# Booking 1: Lahore to Islamabad on Daewoo Express
lhe_isb_trip = Trip.objects.filter(
    route__origin_city__name='Lahore',
    route__destination_city__name='Islamabad'
).first()

if lhe_isb_trip:
    b1, _ = Booking.objects.get_or_create(
        booking_reference='PK-LHE-ISB-2026',
        defaults={
            'user': customer_user,
            'trip': lhe_isb_trip,
            'total_passengers': 2,
            'subtotal_amount': Decimal('4800.00'),
            'discount_amount': Decimal('0.00'),
            'final_amount': Decimal('4800.00'),
            'status': BookingStatus.CONFIRMED,
            'payment_status': PaymentStatus.PAID,
            'contact_email': 'ali.pakistan@apextickets.com',
            'contact_phone': '+92 300 1234567'
        }
    )
    
    seat1 = lhe_isb_trip.vehicle.seats.filter(seat_number='1A').first() or lhe_isb_trip.vehicle.seats.all()[0]
    seat2 = lhe_isb_trip.vehicle.seats.filter(seat_number='1B').first() or lhe_isb_trip.vehicle.seats.all()[1]
    
    p1, _ = BookingPassenger.objects.get_or_create(
        booking=b1, ticket_number='PK-LHE-ISB-1A',
        defaults={
            'full_name': 'Muhammad Ali',
            'id_card_number': '35201-1234567-1',
            'seat': seat1,
            'seat_number': seat1.seat_number,
            'price': Decimal('2400.00')
        }
    )
    t1, _ = DigitalTicket.objects.get_or_create(
        booking=b1, passenger=p1,
        defaults={'ticket_code': 'TC-PK-LHE-ISB-1A'}
    )
    generate_qr_for_ticket(t1)

    p2, _ = BookingPassenger.objects.get_or_create(
        booking=b1, ticket_number='PK-LHE-ISB-1B',
        defaults={
            'full_name': 'Zainab Bibi',
            'id_card_number': '35201-7654321-2',
            'seat': seat2,
            'seat_number': seat2.seat_number,
            'price': Decimal('2400.00')
        }
    )
    t2, _ = DigitalTicket.objects.get_or_create(
        booking=b1, passenger=p2,
        defaults={'ticket_code': 'TC-PK-LHE-ISB-1B'}
    )
    generate_qr_for_ticket(t2)

# Booking 2: Karachi to Lahore on Green Line Rail
khi_lhe_trip = Trip.objects.filter(
    route__origin_city__name='Karachi',
    route__destination_city__name='Lahore'
).first()

if khi_lhe_trip:
    b2, _ = Booking.objects.get_or_create(
        booking_reference='PK-KHI-LHE-2026',
        defaults={
            'user': customer_user,
            'trip': khi_lhe_trip,
            'total_passengers': 1,
            'subtotal_amount': Decimal('4800.00'),
            'discount_amount': Decimal('0.00'),
            'final_amount': Decimal('4800.00'),
            'status': BookingStatus.CONFIRMED,
            'payment_status': PaymentStatus.PAID,
            'contact_email': 'fatima.khan@apextickets.com',
            'contact_phone': '+92 321 9876543'
        }
    )
    seat3 = khi_lhe_trip.vehicle.seats.filter(seat_number='4B').first() or khi_lhe_trip.vehicle.seats.first()
    p3, _ = BookingPassenger.objects.get_or_create(
        booking=b2, ticket_number='PK-KHI-LHE-4B',
        defaults={
            'full_name': 'Fatima Khan',
            'id_card_number': '42101-9876543-8',
            'seat': seat3,
            'seat_number': seat3.seat_number,
            'price': Decimal('4800.00')
        }
    )
    t3, _ = DigitalTicket.objects.get_or_create(
        booking=b2, passenger=p3,
        defaults={'ticket_code': 'TC-PK-KHI-LHE-4B'}
    )
    generate_qr_for_ticket(t3)

print("SUCCESS: Pakistan Transportation Network seeded with 375km Lahore->Islamabad, 1210km Karachi->Lahore, and verified boarding passes!")
