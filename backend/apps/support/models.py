import uuid
from django.db import models
from django.conf import settings
from apps.bookings.models import Booking

def generate_ticket_num():
    return f"SUP-{uuid.uuid4().hex[:6].upper()}"

class SupportCategory(models.TextChoices):
    BOOKING = 'BOOKING', 'Booking Assistance'
    PAYMENT = 'PAYMENT', 'Payment Issue'
    CANCELLATION = 'CANCELLATION', 'Cancellation & Reschedule'
    REFUND = 'REFUND', 'Refund Inquiry'
    BAGGAGE = 'BAGGAGE', 'Baggage Inquiry'
    OTHER = 'OTHER', 'General Inquiry'

class SupportPriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    URGENT = 'URGENT', 'Urgent'

class SupportStatus(models.TextChoices):
    OPEN = 'OPEN', 'Open'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    RESOLVED = 'RESOLVED', 'Resolved'
    CLOSED = 'CLOSED', 'Closed'

class SupportTicket(models.Model):
    ticket_number = models.CharField(max_length=20, unique=True, default=generate_ticket_num)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    
    subject = models.CharField(max_length=200)
    category = models.CharField(max_length=25, choices=SupportCategory.choices, default=SupportCategory.OTHER)
    priority = models.CharField(max_length=15, choices=SupportPriority.choices, default=SupportPriority.MEDIUM)
    status = models.CharField(max_length=20, choices=SupportStatus.choices, default=SupportStatus.OPEN)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['ticket_number']),
            models.Index(fields=['status']),
            models.Index(fields=['user', '-updated_at']),
        ]

    def __str__(self):
        return f"{self.ticket_number} - {self.subject} ({self.status})"

class SupportMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    is_staff_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg on {self.ticket.ticket_number} by {self.sender.email}"
