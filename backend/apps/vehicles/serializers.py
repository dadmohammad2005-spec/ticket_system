from rest_framework import serializers
from .models import Vehicle, Seat

class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = ('id', 'seat_number', 'row', 'column', 'deck', 'seat_type', 'is_accessible', 'price_multiplier', 'is_active')

class VehicleSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.name', read_only=True)
    operator_logo = serializers.CharField(source='operator.logo_url', read_only=True)
    seats = SeatSerializer(many=True, read_only=True)

    class Meta:
        model = Vehicle
        fields = (
            'id', 'operator', 'operator_name', 'operator_logo', 'vehicle_number',
            'vehicle_type', 'model_name', 'total_seats', 'total_rows',
            'seats_per_row', 'has_upper_deck', 'amenities', 'is_active', 'seats'
        )

class VehicleCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'
