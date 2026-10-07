from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Booking, BookingPassenger, BookingStatus, PaymentStatus
from .serializers import (
    BookingListSerializer, BookingDetailSerializer,
    CreateBookingSerializer
)
from apps.trips.models import Trip, TripStatus, SeatLock
from apps.vehicles.models import Seat
from apps.coupons.models import Coupon
from apps.accounts.permissions import IsAdminUserRole

class BookingViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'trip']
    search_fields = ['booking_reference', 'user__email', 'contact_email', 'contact_phone']
    ordering_fields = ['created_at', 'final_amount']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Booking.objects.none()
        if user.is_staff or getattr(user, 'role', '') in ['ADMIN', 'OPERATOR']:
            return Booking.objects.select_related(
                'user', 'trip', 'trip__operator', 'trip__vehicle', 'trip__route',
                'trip__route__origin_city', 'trip__route__destination_city', 'coupon'
            ).prefetch_related('passengers', 'passengers__seat').all()
        return Booking.objects.select_related(
            'user', 'trip', 'trip__operator', 'trip__vehicle', 'trip__route',
            'trip__route__origin_city', 'trip__route__destination_city', 'coupon'
        ).prefetch_related('passengers', 'passengers__seat').filter(user=user)

    def get_serializer_class(self):
        if self.action in ['retrieve', 'by_reference']:
            return BookingDetailSerializer
        elif self.action == 'create':
            return CreateBookingSerializer
        return BookingListSerializer

    def get_permissions(self):
        if self.action in ['by_reference', 'create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = CreateBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        trip_id = serializer.validated_data['trip_id']
        passengers_data = serializer.validated_data['passengers']
        coupon_code = serializer.validated_data.get('coupon_code', '').strip().upper()
        contact_email = serializer.validated_data['contact_email']
        contact_phone = serializer.validated_data['contact_phone']

        # 1. Lock trip for update
        trip = Trip.objects.select_for_update().filter(id=trip_id).first()
        if not trip:
            return Response({'error': 'Trip not found.'}, status=status.HTTP_404_NOT_FOUND)

        if trip.status != TripStatus.SCHEDULED:
            return Response({'error': f"This trip is currently {trip.status} and tickets cannot be booked."}, status=status.HTTP_400_BAD_REQUEST)

        if trip.departure_time <= timezone.now():
            return Response({'error': 'This trip has already departed.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Lock requested seats and ensure they belong to this vehicle
        seat_ids = [p['seat_id'] for p in passengers_data]
        seats = list(Seat.objects.select_for_update().filter(id__in=seat_ids, vehicle=trip.vehicle, is_active=True))
        if len(seats) != len(seat_ids):
            return Response({'error': 'One or more selected seats are invalid for this trip.'}, status=status.HTTP_400_BAD_REQUEST)

        seats_dict = {s.id: s for s in seats}

        # 3. Double-booking prevention: Check if seats are already booked
        already_booked = BookingPassenger.objects.filter(
            booking__trip=trip,
            seat_id__in=seat_ids,
            booking__status__in=[BookingStatus.CONFIRMED, BookingStatus.PENDING]
        ).select_related('seat')

        if already_booked.exists():
            taken_labels = [bp.seat.seat_number for bp in already_booked]
            return Response({
                'error': f"Seat(s) {', '.join(taken_labels)} were just booked by another user. Please choose another seat."
            }, status=status.HTTP_409_CONFLICT)

        # 4. Calculate prices
        subtotal = Decimal('0.00')
        passenger_records_to_create = []

        for p_item in passengers_data:
            seat_obj = seats_dict[p_item['seat_id']]
            seat_price = round(Decimal(str(trip.base_price)) * Decimal(str(seat_obj.price_multiplier)), 2)
            subtotal += seat_price

        # 5. Coupon discount validation
        discount = Decimal('0.00')
        applied_coupon = None
        if coupon_code:
            coupon = Coupon.objects.select_for_update().filter(code__iexact=coupon_code).first()
            if coupon:
                disc_val, msg = coupon.calculate_discount(subtotal)
                if disc_val > 0:
                    discount = disc_val
                    applied_coupon = coupon
                    coupon.times_used += 1
                    coupon.save()

        final_amount = max(Decimal('0.00'), subtotal - discount)

        # Determine booking user (logged-in user or guest customer)
        booking_user = request.user
        if not booking_user or not booking_user.is_authenticated:
            from django.contrib.auth import get_user_model
            UserModel = get_user_model()
            booking_user = UserModel.objects.filter(email=contact_email).first()
            if not booking_user:
                booking_user = UserModel.objects.filter(role='CUSTOMER').first() or UserModel.objects.first()

        # 6. Create Booking
        booking = Booking.objects.create(
            user=booking_user,
            trip=trip,
            coupon=applied_coupon,
            total_passengers=len(passengers_data),
            subtotal_amount=subtotal,
            discount_amount=discount,
            final_amount=final_amount,
            status=BookingStatus.PENDING,
            payment_status=PaymentStatus.UNPAID,
            contact_email=contact_email,
            contact_phone=contact_phone
        )

        # 7. Create Booking Passengers
        for idx, p_item in enumerate(passengers_data, start=1):
            seat_obj = seats_dict[p_item['seat_id']]
            seat_price = round(Decimal(str(trip.base_price)) * Decimal(str(seat_obj.price_multiplier)), 2)
            ticket_num = f"{booking.booking_reference}-{seat_obj.seat_number}"

            BookingPassenger.objects.create(
                booking=booking,
                seat=seat_obj,
                full_name=p_item['full_name'],
                id_card_number=p_item.get('id_card_number', ''),
                phone=p_item.get('phone', ''),
                email=p_item.get('email', ''),
                gender=p_item.get('gender', 'MALE'),
                age=p_item.get('age'),
                seat_number=seat_obj.seat_number,
                price=seat_price,
                ticket_number=ticket_num
            )

        return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path=r'ref/(?P<reference>[^/.]+)', permission_classes=[permissions.AllowAny])
    def by_reference(self, request, reference=None):
        booking = Booking.objects.select_related(
            'user', 'trip', 'trip__operator', 'trip__vehicle', 'trip__route',
            'trip__route__origin_city', 'trip__route__destination_city', 'coupon'
        ).prefetch_related('passengers', 'passengers__seat').filter(booking_reference=reference).first()
        if not booking:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(BookingDetailSerializer(booking).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Dashboard statistics for current user"""
        user_bookings = self.get_queryset()
        now = timezone.now()
        
        total = user_bookings.count()
        upcoming = user_bookings.filter(trip__departure_time__gte=now, status=BookingStatus.CONFIRMED).count()
        completed = user_bookings.filter(trip__departure_time__lt=now, status=BookingStatus.CONFIRMED).count()
        cancelled = user_bookings.filter(status=BookingStatus.CANCELLED).count()

        recent = user_bookings[:5]

        return Response({
            'total_bookings': total,
            'upcoming_trips': upcoming,
            'completed_trips': completed,
            'cancelled_bookings': cancelled,
            'recent_bookings': BookingListSerializer(recent, many=True).data
        })
