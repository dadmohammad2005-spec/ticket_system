from django.db import models
from django.utils import timezone
from apps.routes.models import Route
from apps.operators.models import Operator
from apps.vehicles.models import Vehicle, Seat

class TripStatus(models.TextChoices):
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    BOARDING = 'BOARDING', 'Boarding'
    DEPARTED = 'DEPARTED', 'Departed'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Trip(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='trips')
    operator = models.ForeignKey(Operator, on_delete=models.CASCADE, related_name='trips')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='trips')
    
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    
    base_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Base standard seat ticket price in USD")
    status = models.CharField(max_length=20, choices=TripStatus.choices, default=TripStatus.SCHEDULED)
    
    is_featured = models.BooleanField(default=False)
    cancellation_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['departure_time', 'base_price']
        indexes = [
            models.Index(fields=['departure_time']),
            models.Index(fields=['status']),
            models.Index(fields=['route', 'departure_time']),
            models.Index(fields=['operator']),
        ]

    def __str__(self):
        return f"{self.operator.name} | {self.route.origin_city.name} → {self.route.destination_city.name} | {self.departure_time.strftime('%b %d, %H:%M')}"

    @property
    def duration_minutes(self):
        delta = self.arrival_time - self.departure_time
        return int(delta.total_seconds() // 60)

    @property
    def duration_formatted(self):
        mins = self.duration_minutes
        hours = mins // 60
        m = mins % 60
        if hours > 0 and m > 0:
            return f"{hours}h {m}m"
        elif hours > 0:
            return f"{hours}h"
        return f"{m}m"

    @property
    def total_seats_count(self):
        return self.vehicle.seats.filter(is_active=True).count()

    def get_booked_seat_ids(self):
        """Returns set of seat IDs that are booked or in pending active payment"""
        from apps.bookings.models import BookingPassenger, BookingStatus
        return set(BookingPassenger.objects.filter(
            booking__trip=self,
            booking__status__in=[BookingStatus.CONFIRMED, BookingStatus.PENDING]
        ).values_list('seat_id', flat=True))

    def get_locked_seat_ids(self, exclude_session=None):
        """Returns set of seat IDs that are currently locked by a user during checkout"""
        now = timezone.now()
        locks = SeatLock.objects.filter(trip=self, expires_at__gt=now)
        if exclude_session:
            locks = locks.exclude(session_id=exclude_session)
        return set(locks.values_list('seat_id', flat=True))

    @property
    def available_seats_count(self):
        booked_count = len(self.get_booked_seat_ids())
        return max(0, self.total_seats_count - booked_count)

class SeatLock(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='seat_locks')
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, related_name='locks')
    session_id = models.CharField(max_length=100, help_text="User session or token ID locking this seat")
    locked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="Lock expiration timestamp")

    class Meta:
        unique_together = ('trip', 'seat')
        indexes = [
            models.Index(fields=['trip', 'expires_at']),
        ]

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"Lock: {self.seat.seat_number} on {self.trip.id} expires {self.expires_at}"
