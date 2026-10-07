from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import Review
from .serializers import ReviewSerializer, CreateReviewSerializer
from apps.bookings.models import Booking, BookingStatus

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related('user', 'trip', 'operator', 'trip__route', 'trip__route__origin_city', 'trip__route__destination_city').all()
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['operator', 'trip', 'rating', 'is_verified_purchase']
    ordering_fields = ['created_at', 'rating']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateReviewSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        serializer = CreateReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trip = serializer.validated_data['trip']
        
        # Check if user already reviewed this trip
        if Review.objects.filter(user=request.user, trip=trip).exists():
            return Response({'error': 'You have already reviewed this journey.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user had a confirmed booking on this trip
        has_booking = Booking.objects.filter(user=request.user, trip=trip, status=BookingStatus.CONFIRMED).exists()
        if not has_booking and not request.user.is_staff:
            return Response({'error': 'Only customers who booked and completed this trip may post a review.'}, status=status.HTTP_403_FORBIDDEN)

        review = serializer.save(
            user=request.user,
            operator=trip.operator,
            is_verified_purchase=has_booking
        )
        review.update_operator_rating()

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
