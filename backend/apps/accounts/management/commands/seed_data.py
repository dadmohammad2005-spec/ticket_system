from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.locations.models import Country, City, Station
from apps.operators.models import Operator
from apps.vehicles.models import Vehicle, VehicleType, Seat
from apps.routes.models import Route
from apps.trips.models import Trip, TripStatus
from apps.coupons.models import Coupon, DiscountType
from apps.bookings.models import Booking, BookingPassenger, BookingStatus, PaymentStatus
from apps.payments.models import Payment, PaymentProvider, PaymentStatus as TxStatus
from apps.tickets.models import DigitalTicket
from apps.tickets.generator import generate_qr_for_ticket
from apps.reviews.models import Review

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds realistic production-grade demo data for Apex Online Ticket Booking System'

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        # 1. Users
        admin_user, _ = User.objects.get_or_create(
            email='admin@apextickets.com',
            defaults={
                'username': 'admin',
                'first_name': 'Alexander',
                'last_name': 'Wright',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_verified': True,
            }
        )
        admin_user.set_password('Admin@12345')
        admin_user.save()

        operator_user, _ = User.objects.get_or_create(
            email='operator@apextickets.com',
            defaults={
                'username': 'operator',
                'first_name': 'Marcus',
                'last_name': 'Vance',
                'role': 'OPERATOR',
                'is_staff': True,
                'is_verified': True,
            }
        )
        operator_user.set_password('Operator@12345')
        operator_user.save()

        demo_customer, _ = User.objects.get_or_create(
            email='customer@apextickets.com',
            defaults={
                'username': 'customer',
                'first_name': 'Sarah',
                'last_name': 'Jenkins',
                'role': 'CUSTOMER',
                'phone_number': '+1 (555) 234-5678',
                'id_card_number': 'US-PASSPORT-9823412',
                'address': '742 Evergreen Terrace, Springfield',
                'is_verified': True,
            }
        )
        demo_customer.set_password('Customer@12345')
        demo_customer.save()

        self.stdout.write(self.style.SUCCESS("Users created (admin, operator, customer)"))

        # 2. Countries & Cities
        pk, _ = Country.objects.get_or_create(name='Pakistan', code='PK')

        cities_data = [
            (pk, 'Lahore', 'Punjab', 'LHE', 'https://images.unsplash.com/photo-1588661799406-337553ff7a3a?auto=format&fit=crop&w=600&q=80', True),
            (pk, 'Islamabad', 'Islamabad (Capital)', 'ISB', 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80', True),
            (pk, 'Karachi', 'Sindh', 'KHI', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80', True),
            (pk, 'Rawalpindi', 'Punjab', 'RWP', 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=600&q=80', True),
            (pk, 'Peshawar', 'Khyber Pakhtunkhwa (KPK)', 'PEW', 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80', True),
            (pk, 'Faisalabad', 'Punjab', 'FSD', 'https://images.unsplash.com/photo-1588661799406-337553ff7a3a?auto=format&fit=crop&w=600&q=80', True),
            (pk, 'Multan', 'Punjab', 'MUX', 'https://images.unsplash.com/photo-1588661799406-337553ff7a3a?auto=format&fit=crop&w=600&q=80', True),
            (pk, 'Quetta', 'Balochistan', 'UET', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80', True),
            (pk, 'Murree', 'Punjab', 'MRE', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', True),
        ]

        city_objs = {}
        for country, name, state, code, img, is_pop in cities_data:
            c, _ = City.objects.get_or_create(
                country=country, name=name,
                defaults={'state_province': state, 'code': code, 'image_url': img, 'is_popular': is_pop}
            )
            city_objs[name] = c

        # Stations
        stations_data = [
            (city_objs['Lahore'], 'Lahore Thokar Niaz Baig Terminal', 'LHE-THOKAR', 'Thokar Niaz Baig, Multan Road, Lahore'),
            (city_objs['Islamabad'], 'Islamabad Faizabad Central Terminal', 'ISB-FAIZ', 'Faizabad Interchange, Islamabad'),
            (city_objs['Karachi'], 'Karachi Sohrab Goth Terminal', 'KHI-SOHRAB', 'Main Super Highway, Sohrab Goth, Karachi'),
            (city_objs['Rawalpindi'], 'Rawalpindi Pirwadhai Terminal', 'RWP-PIRW', 'Pirwadhai Bus Stand, Rawalpindi'),
            (city_objs['Peshawar'], 'Peshawar General Bus Stand', 'PEW-GBS', 'GT Road, Haji Camp, Peshawar'),
            (city_objs['Faisalabad'], 'Faisalabad Kohistan Terminal', 'FSD-KOHI', 'Main Satyana Road, Faisalabad'),
            (city_objs['Multan'], 'Multan Kalma Chowk Stand', 'MUX-KALMA', 'Kalma Chowk, Khanewal Road, Multan'),
            (city_objs['Quetta'], 'Quetta Sariab Road Terminal', 'UET-SARIAB', 'Sariab Road, Quetta'),
            (city_objs['Murree'], 'Murree Mall Road Stand', 'MRE-MALL', 'Main Mall Road Stand, Murree'),
        ]
        station_objs = {}
        for city, name, code, addr in stations_data:
            st, _ = Station.objects.get_or_create(
                code=code,
                defaults={'city': city, 'name': name, 'address': addr, 'is_active': True}
            )
            station_objs[city.name] = st

        self.stdout.write(self.style.SUCCESS("Cities and stations created"))

        # 3. Operators
        op1, _ = Operator.objects.get_or_create(
            code='APX',
            defaults={
                'name': 'Apex Express',
                'slug': 'apex-express',
                'logo_url': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80',
                'contact_email': 'support@apexexpress.com',
                'contact_phone': '+1 (800) 555-APEX',
                'website': 'https://apexexpress.com',
                'rating': 4.9,
                'total_reviews': 342,
                'is_verified': True,
            }
        )

        op2, _ = Operator.objects.get_or_create(
            code='VLV',
            defaults={
                'name': 'Velocity Rail Lines',
                'slug': 'velocity-rail-lines',
                'logo_url': 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=200&q=80',
                'contact_email': 'dispatch@velocityrail.com',
                'contact_phone': '+1 (800) 555-RAIL',
                'website': 'https://velocityrail.com',
                'rating': 4.8,
                'total_reviews': 288,
                'is_verified': True,
            }
        )

        op3, _ = Operator.objects.get_or_create(
            code='HZN',
            defaults={
                'name': 'Horizon Luxury Lines',
                'slug': 'horizon-luxury-lines',
                'logo_url': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=200&q=80',
                'contact_email': 'concierge@horizonlines.com',
                'contact_phone': '+1 (888) 777-HORIZON',
                'website': 'https://horizonlines.com',
                'rating': 4.7,
                'total_reviews': 195,
                'is_verified': True,
            }
        )

        # 4. Vehicles & Automatic Seats
        v1, _ = Vehicle.objects.get_or_create(
            vehicle_number='APX-901',
            defaults={
                'operator': op1,
                'vehicle_type': VehicleType.BUS,
                'model_name': 'Volvo 9700 Grand Coach',
                'total_seats': 40,
                'total_rows': 10,
                'seats_per_row': 4,
                'amenities': ["High-Speed Wi-Fi", "AC Climate Control", "USB-C Outlets", "Reclining Leather", "Restroom", "Complimentary Water"]
            }
        )
        v1.generate_default_seats()

        v2, _ = Vehicle.objects.get_or_create(
            vehicle_number='VEL-BULLET-1',
            defaults={
                'operator': op2,
                'vehicle_type': VehicleType.TRAIN,
                'model_name': 'Acela Express High-Speed Train',
                'total_seats': 48,
                'total_rows': 12,
                'seats_per_row': 4,
                'amenities': ["Gigabit Wi-Fi", "Quiet Car", "Bistro Dining Car", "Spacious Legroom", "Panoramic Windows", "Luggage Racks"]
            }
        )
        v2.generate_default_seats()

        v3, _ = Vehicle.objects.get_or_create(
            vehicle_number='HZN-LUX-44',
            defaults={
                'operator': op3,
                'vehicle_type': VehicleType.BUS,
                'model_name': 'Scania Touring VIP Edition',
                'total_seats': 36,
                'total_rows': 9,
                'seats_per_row': 4,
                'amenities': ["Personal Entertainment Screens", "Wi-Fi", "Ergonomic Memory Foam", "Snack Bar", "Power Outlets"]
            }
        )
        v3.generate_default_seats()

        # 5. Routes
        routes_data = [
            (city_objs['Lahore'], city_objs['Islamabad'], station_objs.get('Lahore'), station_objs.get('Islamabad'), 375.0, 270, True),
            (city_objs['Islamabad'], city_objs['Lahore'], station_objs.get('Islamabad'), station_objs.get('Lahore'), 375.0, 270, True),
            (city_objs['Lahore'], city_objs['Karachi'], station_objs.get('Lahore'), station_objs.get('Karachi'), 1210.0, 960, True),
            (city_objs['Karachi'], city_objs['Lahore'], station_objs.get('Karachi'), station_objs.get('Lahore'), 1210.0, 960, True),
            (city_objs['Islamabad'], city_objs['Peshawar'], station_objs.get('Islamabad'), station_objs.get('Peshawar'), 185.0, 135, True),
            (city_objs['Islamabad'], city_objs['Murree'], station_objs.get('Islamabad'), station_objs.get('Murree'), 65.0, 75, True),
            (city_objs['Lahore'], city_objs['Faisalabad'], station_objs.get('Lahore'), station_objs.get('Faisalabad'), 180.0, 120, True),
        ]
        route_objs = []
        for orig, dest, s_orig, s_dest, dist, dur, is_pop in routes_data:
            r, _ = Route.objects.get_or_create(
                origin_city=orig, destination_city=dest,
                defaults={'origin_station': s_orig, 'destination_station': s_dest, 'distance_km': dist, 'estimated_duration_minutes': dur, 'is_popular': is_pop}
            )
            route_objs.append(r)

        # 6. Coupons
        Coupon.objects.get_or_create(
            code='APEX15',
            defaults={
                'discount_type': DiscountType.PERCENTAGE,
                'discount_value': 15.00,
                'min_booking_amount': 30.00,
                'max_discount_amount': 50.00,
                'valid_to': timezone.now() + timedelta(days=90),
                'usage_limit': 1000,
                'is_active': True
            }
        )
        Coupon.objects.get_or_create(
            code='WELCOME10',
            defaults={
                'discount_type': DiscountType.PERCENTAGE,
                'discount_value': 10.00,
                'min_booking_amount': 20.00,
                'valid_to': timezone.now() + timedelta(days=120),
                'usage_limit': 500,
                'is_active': True
            }
        )
        Coupon.objects.get_or_create(
            code='SAVE20',
            defaults={
                'discount_type': DiscountType.FIXED,
                'discount_value': 20.00,
                'min_booking_amount': 60.00,
                'valid_to': timezone.now() + timedelta(days=60),
                'usage_limit': 200,
                'is_active': True
            }
        )

        # 7. Scheduled Trips (Generating over the next 14 days)
        now = timezone.now()
        trips_created = 0

        time_slots = [
            (7, 30, 42.50, op1, v1),
            (9, 15, 68.00, op2, v2),
            (11, 45, 45.00, op3, v3),
            (14, 0, 44.00, op1, v1),
            (16, 30, 72.00, op2, v2),
            (18, 45, 49.00, op3, v3),
            (21, 0, 39.00, op1, v1),
        ]

        for day_offset in range(0, 10):
            target_date = (now + timedelta(days=day_offset)).date()
            for route in route_objs[:4]:  # Top routes
                for hour, minute, price, op, veh in time_slots[:4]:
                    dep_time = timezone.make_aware(
                        timezone.datetime.combine(target_date, timezone.datetime.min.time().replace(hour=hour, minute=minute))
                    )
                    arr_time = dep_time + timedelta(minutes=route.estimated_duration_minutes)

                    trip, created = Trip.objects.get_or_create(
                        route=route,
                        operator=op,
                        vehicle=veh,
                        departure_time=dep_time,
                        defaults={
                            'arrival_time': arr_time,
                            'base_price': price,
                            'status': TripStatus.SCHEDULED,
                            'is_featured': (day_offset <= 2 and hour == 9),
                        }
                    )
                    if created:
                        trips_created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {trips_created} schedule trips across upcoming days"))

        # 8. Demo Confirmed Booking with Tickets & QR Codes
        first_trip = Trip.objects.filter(departure_time__gte=now + timedelta(days=1)).first()
        if first_trip:
            demo_seats = list(first_trip.vehicle.seats.filter(is_active=True)[:2])
            if len(demo_seats) >= 2:
                b, b_created = Booking.objects.get_or_create(
                    booking_reference='APX-DEMO2026',
                    defaults={
                        'user': demo_customer,
                        'trip': first_trip,
                        'total_passengers': 2,
                        'subtotal_amount': first_trip.base_price * 2,
                        'discount_amount': 0.00,
                        'final_amount': first_trip.base_price * 2,
                        'status': BookingStatus.CONFIRMED,
                        'payment_status': PaymentStatus.PAID,
                        'contact_email': demo_customer.email,
                        'contact_phone': demo_customer.phone_number,
                    }
                )

                if b_created:
                    # Passengers
                    bp1 = BookingPassenger.objects.create(
                        booking=b, seat=demo_seats[0], full_name='Muhammad Ali',
                        id_card_number='35201-9876543-1', seat_number=demo_seats[0].seat_number,
                        price=first_trip.base_price, ticket_number=f"{b.booking_reference}-{demo_seats[0].seat_number}"
                    )
                    bp2 = BookingPassenger.objects.create(
                        booking=b, seat=demo_seats[1], full_name='Fatima Ali',
                        id_card_number='35201-9876543-2', seat_number=demo_seats[1].seat_number,
                        price=first_trip.base_price, ticket_number=f"{b.booking_reference}-{demo_seats[1].seat_number}"
                    )

                    # Payment
                    Payment.objects.create(
                        booking=b, user=demo_customer, provider=PaymentProvider.SANDBOX_MOCK,
                        amount=b.final_amount, currency='PKR', status=TxStatus.PAID,
                        provider_response={'auth_code': 'DEMO88', 'card_last4': '4242'}
                    )

                    # Digital tickets
                    for bp in [bp1, bp2]:
                        dt, _ = DigitalTicket.objects.get_or_create(booking=b, passenger=bp)
                        try:
                            generate_qr_for_ticket(dt)
                        except Exception:
                            pass

                    # Review
                    Review.objects.get_or_create(
                        user=demo_customer, trip=first_trip, operator=first_trip.operator,
                        defaults={
                            'rating': 5,
                            'cleanliness_rating': 5,
                            'punctuality_rating': 5,
                            'staff_rating': 5,
                            'comment': 'Outstanding ride! Departed on the exact minute, seats were plush leather with high-speed Wi-Fi throughout.',
                            'is_verified_purchase': True
                        }
                    )

        self.stdout.write(self.style.SUCCESS("Demo bookings, QR tickets, and customer reviews seeded successfully!"))
