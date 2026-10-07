import uuid
from django.db import models
from django.conf import settings
from apps.trips.models import Trip
from apps.vehicles.models import Seat
from apps.coupons.models import Coupon

class BookingStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Payment'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    REFUNDED = 'REFUNDED', 'Refunded'

class PaymentStatus(models.TextChoices):
    UNPAID = 'UNPAID', 'Unpaid'
    PAID = 'PAID', 'Paid'
    REFUNDED = 'REFUNDED', 'Refunded'
    PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED', 'Partially Refunded'

def generate_booking_reference():
    return f"APX-{uuid.uuid4().hex[:8].upper()}"

class Booking(models.Model):
    booking_reference = models.CharField(max_length=30, unique=True, default=generate_booking_reference)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    trip = models.ForeignKey(Trip, on_delete=models.PROTECT, related_name='bookings')
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    
    total_passengers = models.PositiveIntegerField(default=1)
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=BookingStatus.choices, default=BookingStatus.PENDING)
    payment_status = models.CharField(max_length=25, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=30)
    
    cancellation_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['booking_reference']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
        ]

    def __str__(self):
        return f"{self.booking_reference} - {self.user.email} - {self.status}"

class BookingPassenger(models.Model):
    GENDER_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='passengers')
    seat = models.ForeignKey(Seat, on_delete=models.PROTECT, related_name='booking_passengers')
    
    full_name = models.CharField(max_length=150)
    id_card_number = models.CharField(max_length=50, blank=True, help_text="CNIC or Passport Number")
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='MALE')
    age = models.PositiveIntegerField(null=True, blank=True)
    
    seat_number = models.CharField(max_length=10)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    ticket_number = models.CharField(max_length=50, unique=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['seat_number']
        indexes = [
            models.Index(fields=['ticket_number']),
            models.Index(fields=['seat']),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.seat_number}) - {self.ticket_number}"
