import uuid
from django.db import models
from apps.bookings.models import Booking, BookingPassenger

def generate_ticket_code():
    return f"TC-{uuid.uuid4().hex[:10].upper()}"

class DigitalTicket(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='digital_tickets')
    passenger = models.OneToOneField(BookingPassenger, on_delete=models.CASCADE, related_name='digital_ticket')
    ticket_code = models.CharField(max_length=64, unique=True, default=generate_ticket_code)
    
    qr_code_image = models.ImageField(upload_to='tickets/qr/', blank=True, null=True)
    qr_data = models.TextField(blank=True)
    
    is_validated = models.BooleanField(default=False, help_text="True if scanned and validated at boarding gate")
    validated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket_code']),
            models.Index(fields=['is_validated']),
        ]

    def __str__(self):
        return f"{self.ticket_code} - {self.passenger.full_name} ({self.passenger.seat_number})"
