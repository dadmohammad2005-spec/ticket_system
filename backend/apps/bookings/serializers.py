from rest_framework import serializers
from .models import Booking, BookingPassenger
from apps.trips.serializers import TripListSerializer
from apps.vehicles.serializers import SeatSerializer
from apps.coupons.serializers import CouponSerializer

class BookingPassengerSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPassenger
        fields = (
            'id', 'seat', 'seat_number', 'full_name', 'id_card_number',
            'phone', 'email', 'gender', 'age', 'price', 'ticket_number', 'created_at'
        )
        read_only_fields = ('price', 'ticket_number', 'seat_number', 'created_at')

class BookingPassengerInputSerializer(serializers.Serializer):
    seat_id = serializers.IntegerField(required=True)
    full_name = serializers.CharField(max_length=150, required=True)
    id_card_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=['MALE', 'FEMALE', 'OTHER'], default='MALE')
    age = serializers.IntegerField(required=False, allow_null=True)

class CreateBookingSerializer(serializers.Serializer):
    trip_id = serializers.IntegerField(required=True)
    contact_email = serializers.EmailField(required=True)
    contact_phone = serializers.CharField(max_length=30, required=True)
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    passengers = BookingPassengerInputSerializer(many=True, required=True)

    def validate_passengers(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one passenger must be provided.")
        seat_ids = [p['seat_id'] for p in value]
        if len(seat_ids) != len(set(seat_ids)):
            raise serializers.ValidationError("Duplicate seats cannot be selected in the same booking.")
        return value

class BookingListSerializer(serializers.ModelSerializer):
    trip_detail = TripListSerializer(source='trip', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'booking_reference', 'user', 'user_email', 'trip', 'trip_detail',
            'total_passengers', 'subtotal_amount', 'discount_amount', 'final_amount',
            'status', 'payment_status', 'contact_email', 'contact_phone',
            'cancellation_reason', 'cancelled_at', 'created_at', 'updated_at'
        )

class BookingDetailSerializer(BookingListSerializer):
    passengers = BookingPassengerSerializer(many=True, read_only=True)
    coupon_detail = CouponSerializer(source='coupon', read_only=True)

    class Meta(BookingListSerializer.Meta):
        fields = BookingListSerializer.Meta.fields + ('passengers', 'coupon_detail')
