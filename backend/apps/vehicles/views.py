from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Vehicle, Seat
from .serializers import VehicleSerializer, VehicleCreateUpdateSerializer, SeatSerializer
from apps.accounts.permissions import IsOperatorOrAdmin

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.select_related('operator').prefetch_related('seats').all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['operator', 'vehicle_type', 'is_active']
    search_fields = ['vehicle_number', 'model_name', 'operator__name']
    ordering_fields = ['vehicle_number', 'total_seats', 'created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return VehicleCreateUpdateSerializer
        return VehicleSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate_seats']:
            return [IsOperatorOrAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        vehicle = serializer.save()
        vehicle.generate_default_seats()

    @action(detail=True, methods=['post'])
    def generate_seats(self, request, pk=None):
        vehicle = self.get_object()
        vehicle.generate_default_seats()
        return Response({'message': f"Seats generated for {vehicle.vehicle_number}"}, status=status.HTTP_200_OK)

class SeatViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Seat.objects.all()
    serializer_class = SeatSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['vehicle', 'deck', 'seat_type', 'is_accessible']
    permission_classes = [permissions.AllowAny]
