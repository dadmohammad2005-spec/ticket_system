from rest_framework import serializers
from .models import Route
from apps.locations.serializers import CitySerializer, StationSerializer

class RouteSerializer(serializers.ModelSerializer):
    origin_city_detail = CitySerializer(source='origin_city', read_only=True)
    destination_city_detail = CitySerializer(source='destination_city', read_only=True)
    origin_station_detail = StationSerializer(source='origin_station', read_only=True)
    destination_station_detail = StationSerializer(source='destination_station', read_only=True)
    duration_formatted = serializers.ReadOnlyField()

    class Meta:
        model = Route
        fields = (
            'id', 'origin_city', 'destination_city', 'origin_station', 'destination_station',
            'origin_city_detail', 'destination_city_detail', 'origin_station_detail', 'destination_station_detail',
            'distance_km', 'estimated_duration_minutes', 'duration_formatted', 'is_popular', 'is_active', 'created_at'
        )

class RouteCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'
