from rest_framework import serializers
from .models import Payment, PaymentRefund

class PaymentSerializer(serializers.ModelSerializer):
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'booking', 'booking_reference', 'user', 'user_email',
            'transaction_id', 'provider', 'amount', 'currency', 'status',
            'provider_response', 'error_message', 'created_at', 'updated_at'
        )
        read_only_fields = ('transaction_id', 'status', 'provider_response', 'error_message', 'created_at')

class CheckoutRequestSerializer(serializers.Serializer):
    booking_reference = serializers.CharField(required=True)
    provider = serializers.CharField(default='SANDBOX_MOCK')
    payment_details = serializers.DictField(default=dict)

class RefundRequestSerializer(serializers.Serializer):
    booking_reference = serializers.CharField(required=True)
    reason = serializers.CharField(required=False, default="Customer requested cancellation")

class PaymentRefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentRefund
        fields = '__all__'
