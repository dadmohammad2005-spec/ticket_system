from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Trip, TripStatus, SeatLock
from .serializers import (
    TripListSerializer, TripDetailSerializer,
    TripCreateUpdateSerializer, TripSeatLayoutSerializer
)
from apps.vehicles.models import Seat
from apps.accounts.permissions import IsOperatorOrAdmin

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.select_related(
        'route', 'operator', 'vehicle',
        'route__origin_city', 'route__destination_city',
        'route__origin_station', 'route__destination_station'
    ).prefetch_related('vehicle__seats').all()
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['operator', 'status', 'is_featured', 'vehicle__vehicle_type']
    search_fields = [
        'route__origin_city__name', 'route__destination_city__name',
        'operator__name', 'vehicle__model_name'
    ]
    ordering_fields = ['base_price', 'departure_time', 'arrival_time', 'operator__rating']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TripDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TripCreateUpdateSerializer
        return TripListSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'cancel_trip']:
            return [IsOperatorOrAdmin()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # Filter by origin city (name or ID)
        origin = params.get('origin') or params.get('origin_city')
        if origin:
            if origin.isdigit():
                qs = qs.filter(route__origin_city_id=int(origin))
            else:
                qs = qs.filter(route__origin_city__name__icontains=origin)

        # Filter by destination city (name or ID)
        destination = params.get('destination') or params.get('destination_city')
        if destination:
            if destination.isdigit():
                qs = qs.filter(route__destination_city_id=int(destination))
            else:
                qs = qs.filter(route__destination_city__name__icontains=destination)

        # Filter by departure date
        date_str = params.get('date') or params.get('departure_date')
        if date_str:
            try:
                search_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                qs = qs.filter(departure_time__date=search_date)
            except ValueError:
                pass

        # Filter by price range
        min_price = params.get('min_price')
        if min_price:
            qs = qs.filter(base_price__gte=min_price)
        max_price = params.get('max_price')
        if max_price:
            qs = qs.filter(base_price__lte=max_price)

        # Filter by operator rating
        min_rating = params.get('min_rating')
        if min_rating:
            qs = qs.filter(operator__rating__gte=min_rating)

        # Custom sorting logic
        sort = params.get('sort')
        if sort == 'cheapest':
            qs = qs.order_by('base_price')
        elif sort == 'fastest':
            qs = qs.order_by('route__estimated_duration_minutes')
        elif sort == 'best_rated':
            qs = qs.order_by('-operator__rating')
        elif sort == 'earliest':
            qs = qs.order_by('departure_time')

        return qs

    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_trips = self.get_queryset().filter(is_featured=True, status=TripStatus.SCHEDULED)[:6]
        serializer = TripListSerializer(featured_trips, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def lock_seats(self, request, pk=None):
        """Temporarily lock seats for 10 minutes during checkout to prevent race conditions"""
        trip = self.get_object()
        seat_ids = request.data.get('seat_ids', [])
        session_id = request.data.get('session_id') or request.headers.get('X-Session-ID', 'anon-session')
        
        if not seat_ids or not isinstance(seat_ids, list):
            return Response({'error': 'Please provide a valid list of seat_ids.'}, status=status.HTTP_400_BAD_REQUEST)

        # Clean expired locks first
        SeatLock.objects.filter(expires_at__lte=timezone.now()).delete()

        # Check if already booked
        booked_ids = trip.get_booked_seat_ids()
        for s_id in seat_ids:
            if s_id in booked_ids:
                seat_obj = Seat.objects.filter(id=s_id).first()
                seat_label = seat_obj.seat_number if seat_obj else str(s_id)
                return Response(
                    {'error': f"Seat {seat_label} has already been booked by another passenger. Please choose another seat."},
                    status=status.HTTP_409_CONFLICT
                )

        # Check if locked by someone else
        locked_by_others = trip.get_locked_seat_ids(exclude_session=session_id)
        for s_id in seat_ids:
            if s_id in locked_by_others:
                seat_obj = Seat.objects.filter(id=s_id).first()
                seat_label = seat_obj.seat_number if seat_obj else str(s_id)
                return Response(
                    {'error': f"Seat {seat_label} is currently on hold by another customer. Please wait or select another seat."},
                    status=status.HTTP_409_CONFLICT
                )

        # Apply or refresh lock for 10 minutes
        expires = timezone.now() + timedelta(minutes=10)
        for s_id in seat_ids:
            SeatLock.objects.update_or_create(
                trip=trip, seat_id=s_id,
                defaults={'session_id': session_id, 'expires_at': expires}
            )

        return Response({
            'message': 'Seats held successfully for 10 minutes.',
            'expires_at': expires.isoformat(),
            'locked_seat_ids': seat_ids
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def cancel_trip(self, request, pk=None):
        trip = self.get_object()
        reason = request.data.get('reason', 'Trip cancelled by operator')
        trip.status = TripStatus.CANCELLED
        trip.cancellation_reason = reason
        trip.save()
        return Response({'message': f"Trip {trip.id} has been marked CANCELLED."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def custom_journey(self, request):
        """
        Accepts any origin and destination written by user (Pakistan or anywhere in the world),
        calculates distance in KM, travel duration, scheduled arrival time, and rent (fare in PKR),
        and generates an authentic confirmed boarding pass with verifiable QR code.
        """
        origin = (request.data.get('origin') or request.data.get('origin_city') or '').strip()
        destination = (request.data.get('destination') or request.data.get('destination_city') or '').strip()
        passenger_name = request.data.get('passenger_name', '').strip() or 'Muhammad Ali'
        seat_number = request.data.get('seat_number', '1A').strip() or '1A'
        date_str = request.data.get('departure_date', '').strip()
        time_str = request.data.get('departure_time', '').strip()

        if not origin or not destination:
            return Response({'error': 'Please provide both origin and destination city names.'}, status=status.HTTP_400_BAD_REQUEST)

        # Parse departure datetime if provided
        dep_datetime = None
        if date_str:
            try:
                if time_str:
                    dep_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                else:
                    dep_datetime = datetime.strptime(f"{date_str} 08:30", "%Y-%m-%d %H:%M")
                dep_datetime = timezone.make_aware(dep_datetime)
            except Exception:
                dep_datetime = timezone.now() + timedelta(hours=2)
        else:
            dep_datetime = timezone.now() + timedelta(hours=2)

        from .custom_journey import create_custom_journey_booking
        try:
            result = create_custom_journey_booking(
                origin_city_name=origin,
                dest_city_name=destination,
                passenger_name=passenger_name,
                seat_number=seat_number,
                departure_datetime=dep_datetime,
                user=request.user if request.user.is_authenticated else None,
                contact_email=getattr(request.user, 'email', 'passenger@apextravel.com'),
                contact_phone=getattr(request.user, 'phone_number', '+92 300 1234567')
            )
            return Response({
                'success': True,
                'booking_reference': result['booking_reference'],
                'origin_city': result['origin_city'],
                'destination_city': result['destination_city'],
                'origin_station': result['origin_station'],
                'destination_station': result['destination_station'],
                'distance_km': result['distance_km'],
                'duration_formatted': result['duration_formatted'],
                'rent': result['rent'],
                'departure_time': result['departure_time'],
                'arrival_time': result['arrival_time'],
                'passenger_name': result['passenger_name'],
                'seat_number': result['seat_number'],
                'ticket_number': result['ticket_number'],
                'qr_data': result['qr_data'],
                'ticket_url': result['ticket_url'],
                'print_url': request.build_absolute_uri(result['print_url']),
                'pdf_url': request.build_absolute_uri(result['pdf_url']),
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

