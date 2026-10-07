from rest_framework import serializers
from .models import DigitalTicket
from apps.bookings.models import BookingPassenger

class DigitalTicketSerializer(serializers.ModelSerializer):
    passenger_name = serializers.CharField(source='passenger.full_name', read_only=True)
    seat_number = serializers.CharField(source='passenger.seat_number', read_only=True)
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    trip_id = serializers.IntegerField(source='booking.trip.id', read_only=True)
    origin_city = serializers.CharField(source='booking.trip.route.origin_city.name', read_only=True)
    destination_city = serializers.CharField(source='booking.trip.route.destination_city.name', read_only=True)
    departure_time = serializers.DateTimeField(source='booking.trip.departure_time', read_only=True)
    operator_name = serializers.CharField(source='booking.trip.operator.name', read_only=True)

    class Meta:
        model = DigitalTicket
        fields = (
            'id', 'ticket_code', 'booking', 'booking_reference', 'passenger', 'passenger_name',
            'seat_number', 'trip_id', 'origin_city', 'destination_city', 'departure_time',
            'operator_name', 'qr_code_image', 'qr_data', 'is_validated', 'validated_at', 'created_at'
        )
