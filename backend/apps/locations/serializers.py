from rest_framework import serializers
from .models import Country, City, Station

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = '__all__'

class StationSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    country_name = serializers.CharField(source='city.country.name', read_only=True)

    class Meta:
        model = Station
        fields = ('id', 'name', 'code', 'city', 'city_name', 'country_name', 'address', 'latitude', 'longitude', 'contact_number', 'is_active')

class CitySerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    stations = StationSerializer(many=True, read_only=True)

    class Meta:
        model = City
        fields = ('id', 'name', 'state_province', 'country', 'country_name', 'code', 'image_url', 'is_popular', 'stations')
