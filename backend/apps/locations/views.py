from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Country, City, Station
from .serializers import CountrySerializer, CitySerializer, StationSerializer
from apps.accounts.permissions import IsAdminUserRole

class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    filter_backends = [SearchFilter]
    search_fields = ['name', 'code']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUserRole()]
        return [permissions.AllowAny()]

class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.select_related('country').prefetch_related('stations').all()
    serializer_class = CitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['country', 'is_popular']
    search_fields = ['name', 'state_province', 'code']
    ordering_fields = ['name', 'is_popular']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUserRole()]
        return [permissions.AllowAny()]

    @action(detail=False, methods=['get'])
    def popular(self, request):
        popular_cities = self.queryset.filter(is_popular=True)
        serializer = self.get_serializer(popular_cities, many=True)
        return Response(serializer.data)

class StationViewSet(viewsets.ModelViewSet):
    queryset = Station.objects.select_related('city', 'city__country').filter(is_active=True)
    serializer_class = StationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['city', 'is_active']
    search_fields = ['name', 'code', 'address', 'city__name']
    ordering_fields = ['name', 'city__name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUserRole()]
        return [permissions.AllowAny()]
