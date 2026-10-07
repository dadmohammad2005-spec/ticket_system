import uuid
from django.db import models
from django.conf import settings
from apps.bookings.models import Booking

class PaymentProvider(models.TextChoices):
    STRIPE = 'STRIPE', 'Stripe (Credit / Debit Cards)'
    PAYPAL = 'PAYPAL', 'PayPal'
    JAZZCASH = 'JAZZCASH', 'JazzCash Mobile Wallet'
    EASYPAISA = 'EASYPAISA', 'Easypaisa Mobile Wallet'
    BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Wire / Direct Transfer'
    SANDBOX_MOCK = 'SANDBOX_MOCK', 'Apex Instant Simulator (Sandbox)'

class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PROCESSING = 'PROCESSING', 'Processing'
    PAID = 'PAID', 'Paid / Completed'
    FAILED = 'FAILED', 'Failed'
    REFUNDED = 'REFUNDED', 'Refunded'
    CANCELLED = 'CANCELLED', 'Cancelled'

def generate_tx_id():
    return f"TXN-{uuid.uuid4().hex[:12].upper()}"

class Payment(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.PROTECT, related_name='payments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    
    transaction_id = models.CharField(max_length=64, unique=True, default=generate_tx_id)
    provider = models.CharField(max_length=30, choices=PaymentProvider.choices, default=PaymentProvider.SANDBOX_MOCK)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    
    provider_response = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_id']),
            models.Index(fields=['booking', 'status']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.transaction_id} - ${self.amount} ({self.status}) via {self.provider}"

class PaymentRefund(models.Model):
    REFUND_STATUS = (
        ('PENDING', 'Pending Admin Review'),
        ('APPROVED', 'Approved & Processed'),
        ('REJECTED', 'Rejected'),
    )
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='refunds')
    booking = models.ForeignKey(Booking, on_delete=models.PROTECT, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=REFUND_STATUS, default='APPROVED')
    refund_transaction_id = models.CharField(max_length=64, unique=True, default=generate_tx_id)
    
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_refunds'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Refund {self.refund_transaction_id} - ${self.amount} for Booking {self.booking.booking_reference}"
