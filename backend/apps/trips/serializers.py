from rest_framework import serializers
from .models import Trip, SeatLock
from apps.routes.serializers import RouteSerializer
from apps.operators.serializers import OperatorSerializer
from apps.vehicles.serializers import VehicleSerializer
from apps.vehicles.models import Seat

class TripSeatLayoutSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    class Meta:
        model = Seat
        fields = ('id', 'seat_number', 'row', 'column', 'deck', 'seat_type', 'is_accessible', 'price_multiplier', 'price', 'status')

    def get_price(self, obj):
        trip = self.context.get('trip')
        if trip:
            return round(float(trip.base_price) * float(obj.price_multiplier), 2)
        return 0.0

    def get_status(self, obj):
        booked_seat_ids = self.context.get('booked_seat_ids', set())
        locked_seat_ids = self.context.get('locked_seat_ids', set())
        
        if obj.id in booked_seat_ids:
            return 'booked'
        if obj.id in locked_seat_ids:
            return 'locked'
        if not obj.is_active:
            return 'disabled'
        return 'available'

class TripListSerializer(serializers.ModelSerializer):
    route_detail = RouteSerializer(source='route', read_only=True)
    operator_detail = OperatorSerializer(source='operator', read_only=True)
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)
    duration_formatted = serializers.ReadOnlyField()
    available_seats_count = serializers.ReadOnlyField()

    class Meta:
        model = Trip
        fields = (
            'id', 'route', 'operator', 'vehicle', 'route_detail', 'operator_detail',
            'vehicle_detail', 'departure_time', 'arrival_time', 'duration_formatted',
            'base_price', 'status', 'is_featured', 'available_seats_count', 'created_at'
        )

class TripDetailSerializer(TripListSerializer):
    seats_layout = serializers.SerializerMethodField()

    class Meta(TripListSerializer.Meta):
        fields = TripListSerializer.Meta.fields + ('seats_layout', 'cancellation_reason')

    def get_seats_layout(self, obj):
        booked_seat_ids = obj.get_booked_seat_ids()
        session_id = self.context.get('request').headers.get('X-Session-ID') if self.context.get('request') else None
        locked_seat_ids = obj.get_locked_seat_ids(exclude_session=session_id)
        
        seats = obj.vehicle.seats.filter(is_active=True).order_by('deck', 'row', 'column')
        context = {
            'trip': obj,
            'booked_seat_ids': booked_seat_ids,
            'locked_seat_ids': locked_seat_ids
        }
        return TripSeatLayoutSerializer(seats, many=True, context=context).data

class TripCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = '__all__'
