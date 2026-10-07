from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Route
from .serializers import RouteSerializer, RouteCreateUpdateSerializer
from apps.accounts.permissions import IsOperatorOrAdmin

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.select_related(
        'origin_city', 'destination_city', 'origin_station', 'destination_station'
    ).all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['origin_city', 'destination_city', 'is_popular', 'is_active']
    search_fields = ['origin_city__name', 'destination_city__name', 'origin_station__name', 'destination_station__name']
    ordering_fields = ['distance_km', 'estimated_duration_minutes', 'created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RouteCreateUpdateSerializer
        return RouteSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOperatorOrAdmin()]
        return [permissions.AllowAny()]

    @action(detail=False, methods=['get'])
    def popular(self, request):
        popular_routes = self.queryset.filter(is_popular=True, is_active=True)[:10]
        serializer = RouteSerializer(popular_routes, many=True)
        return Response(serializer.data)
