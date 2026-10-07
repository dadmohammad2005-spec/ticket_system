import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.locations.models import Country, City
from apps.operators.models import Operator
from apps.vehicles.models import Vehicle, VehicleType, Seat
from apps.routes.models import Route
from apps.trips.models import Trip, TripStatus
from apps.bookings.models import Booking, BookingStatus, PaymentStatus
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

User = get_user_model()

@pytest.mark.django_db
class TestOnlineTicketSystem:
    def setup_method(self):
        self.client = APIClient()
        
        # Create users
        self.user = User.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='TestPassword123!',
            first_name='Test',
            last_name='User',
            role='CUSTOMER'
        )
        self.admin = User.objects.create_superuser(
            email='adminuser@example.com',
            username='adminuser',
            password='AdminPassword123!',
            role='ADMIN'
        )

        # Create Country & Cities
        self.country = Country.objects.create(name='Test Country', code='TC')
        self.city_a = City.objects.create(country=self.country, name='Metro City', code='MTR')
        self.city_b = City.objects.create(country=self.country, name='Coast City', code='CST')

        # Create Operator, Vehicle & Seats
        self.operator = Operator.objects.create(
            name='Test Express',
            code='TEX',
            contact_email='info@test.com',
            contact_phone='1234567890'
        )
        self.vehicle = Vehicle.objects.create(
            operator=self.operator,
            vehicle_number='TEX-101',
            vehicle_type=VehicleType.BUS,
            model_name='Luxury Coach',
            total_seats=4,
            total_rows=2,
            seats_per_row=2
        )
        self.vehicle.generate_default_seats()
        self.seats = list(self.vehicle.seats.all())

        # Create Route & Trip
        self.route = Route.objects.create(
            origin_city=self.city_a,
            destination_city=self.city_b,
            distance_km=200,
            estimated_duration_minutes=150
        )
        self.departure = timezone.now() + timedelta(days=2)
        self.trip = Trip.objects.create(
            route=self.route,
            operator=self.operator,
            vehicle=self.vehicle,
            departure_time=self.departure,
            arrival_time=self.departure + timedelta(minutes=150),
            base_price=Decimal('50.00'),
            status=TripStatus.SCHEDULED
        )

    def test_user_registration_and_login(self):
        # Register
        reg_payload = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'New',
            'last_name': 'Person',
            'phone_number': '555-1234'
        }
        res = self.client.post('/api/auth/register/', reg_payload)
        assert res.status_code == 201
        assert res.data['user']['email'] == 'newuser@example.com'

        # Login
        login_res = self.client.post('/api/auth/login/', {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!'
        })
        assert login_res.status_code == 200
        assert 'access' in login_res.data
        assert 'refresh' in login_res.data

    def test_trip_search(self):
        res = self.client.get(f'/api/trips/?origin={self.city_a.name}&destination={self.city_b.name}')
        assert res.status_code == 200
        assert len(res.data['results']) >= 1
        assert res.data['results'][0]['operator_detail']['code'] == 'TEX'

    def test_seat_layout_and_status(self):
        res = self.client.get(f'/api/trips/{self.trip.id}/')
        assert res.status_code == 200
        assert 'seats_layout' in res.data
        seats = res.data['seats_layout']
        assert len(seats) == 4
        assert seats[0]['status'] == 'available'

    def test_booking_creation_and_double_booking_prevention(self):
        self.client.force_authenticate(user=self.user)

        target_seat = self.seats[0]

        booking_payload = {
            'trip_id': self.trip.id,
            'contact_email': 'testuser@example.com',
            'contact_phone': '555-9876',
            'passengers': [
                {
                    'seat_id': target_seat.id,
                    'full_name': 'Passenger One',
                    'id_card_number': 'CNIC-10293',
                    'gender': 'MALE',
                    'age': 28
                }
            ]
        }

        # 1. Create initial booking
        res1 = self.client.post('/api/bookings/', booking_payload, format='json')
        assert res1.status_code == 201
        booking_ref = res1.data['booking_reference']
        assert res1.data['status'] == 'PENDING'

        # 2. Try to book the exact same seat concurrently -> MUST PREVENT DOUBLE BOOKING
        other_user = User.objects.create_user(
            email='other@example.com', username='other', password='Password123!'
        )
        self.client.force_authenticate(user=other_user)
        res2 = self.client.post('/api/bookings/', booking_payload, format='json')
        assert res2.status_code == 409  # Conflict! Double booking prevented!

        # 3. Complete payment for initial booking
        self.client.force_authenticate(user=self.user)
        pay_res = self.client.post('/api/payments/checkout/', {
            'booking_reference': booking_ref,
            'provider': 'SANDBOX_MOCK',
            'payment_details': {'card_number': '4242424242424242'}
        }, format='json')
        assert pay_res.status_code == 200
        assert pay_res.data['status'] == 'CONFIRMED'

        # 4. Check digital ticket was generated
        booking = Booking.objects.get(booking_reference=booking_ref)
        assert booking.status == BookingStatus.CONFIRMED
        assert booking.payment_status == PaymentStatus.PAID
        assert booking.digital_tickets.count() == 1
        ticket = booking.digital_tickets.first()
        assert ticket.ticket_code.startswith('TC-')

        # 5. Verify ticket via public QR verify endpoint
        verify_res = self.client.get(f'/api/tickets/verify/{ticket.ticket_code}/')
        assert verify_res.status_code == 200
        assert verify_res.data['valid'] is True
        assert verify_res.data['passenger_name'] == 'Passenger One'

        # 6. Download official PDF boarding pass
        pdf_res = self.client.get(f'/api/tickets/download-pdf/{booking_ref}/')
        assert pdf_res.status_code == 200
        assert pdf_res['Content-Type'] == 'application/pdf'
        assert len(pdf_res.content) > 1000

        # 7. Render real HTML boarding pass for browser printing
        ticket_html_res = self.client.get(f'/ticket/{booking_ref}/')
        assert ticket_html_res.status_code == 200
        assert 'Passenger One' in ticket_html_res.content.decode('utf-8')
        assert 'data:image/png;base64' in ticket_html_res.content.decode('utf-8')
        assert 'window.print()' in ticket_html_res.content.decode('utf-8')
