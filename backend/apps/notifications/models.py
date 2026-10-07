from django.db import models
from django.conf import settings

class NotificationType(models.TextChoices):
    BOOKING_CONFIRMED = 'BOOKING_CONFIRMED', 'Booking Confirmed'
    PAYMENT_SUCCESS = 'PAYMENT_SUCCESS', 'Payment Received'
    TRIP_REMINDER = 'TRIP_REMINDER', 'Trip Reminder'
    TRIP_CANCELLED = 'TRIP_CANCELLED', 'Trip Cancelled'
    PROMOTION = 'PROMOTION', 'Promotion / Special Offer'
    SYSTEM = 'SYSTEM', 'System Alert'

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['notification_type']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title} ({'Read' if self.is_read else 'Unread'})"
