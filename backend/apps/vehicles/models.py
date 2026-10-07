from django.db import models
from apps.operators.models import Operator

class VehicleType(models.TextChoices):
    BUS = 'BUS', 'Luxury Coach / Bus'
    TRAIN = 'TRAIN', 'Express Train'
    FLIGHT = 'FLIGHT', 'Commercial Flight'
    FERRY = 'FERRY', 'High-Speed Ferry'

class SeatType(models.TextChoices):
    STANDARD = 'STANDARD', 'Standard'
    WINDOW = 'WINDOW', 'Window Seat'
    AISLE = 'AISLE', 'Aisle Seat'
    VIP = 'VIP', 'VIP / First Class'
    SLEEPER = 'SLEEPER', 'Sleeper Berth'

class DeckType(models.TextChoices):
    LOWER = 'LOWER', 'Lower Deck / Main Floor'
    UPPER = 'UPPER', 'Upper Deck'

def default_amenities():
    return ["Wi-Fi", "USB Power Outlets", "Air Conditioning", "Reclining Leather Seats", "Reading Lights"]

class Vehicle(models.Model):
    operator = models.ForeignKey(Operator, on_delete=models.CASCADE, related_name='vehicles')
    vehicle_number = models.CharField(max_length=50, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VehicleType.choices, default=VehicleType.BUS)
    model_name = models.CharField(max_length=150)
    total_seats = models.PositiveIntegerField(default=40)
    total_rows = models.PositiveIntegerField(default=10)
    seats_per_row = models.PositiveIntegerField(default=4)
    has_upper_deck = models.BooleanField(default=False)
    amenities = models.JSONField(default=default_amenities, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['operator', 'vehicle_number']
        indexes = [
            models.Index(fields=['vehicle_number']),
            models.Index(fields=['vehicle_type']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.operator.name} - {self.model_name} ({self.vehicle_number})"

    def generate_default_seats(self):
        """Generates standard grid seating if seats are not populated yet"""
        if self.seats.exists():
            return
        
        column_letters = ['A', 'B', 'C', 'D', 'E', 'F']
        seats_to_create = []
        
        for r in range(1, self.total_rows + 1):
            for c in range(1, self.seats_per_row + 1):
                col_letter = column_letters[c - 1] if c <= len(column_letters) else str(c)
                seat_num = f"{r}{col_letter}"
                
                # Determine seat type
                if c == 1 or c == self.seats_per_row:
                    s_type = SeatType.WINDOW
                elif c == 2 or c == 3:
                    s_type = SeatType.AISLE
                else:
                    s_type = SeatType.STANDARD
                
                # Rows 1 and 2 can be VIP
                if r <= 2:
                    s_type = SeatType.VIP
                    multiplier = 1.30
                else:
                    multiplier = 1.00

                seats_to_create.append(Seat(
                    vehicle=self,
                    seat_number=seat_num,
                    row=r,
                    column=c,
                    deck=DeckType.LOWER,
                    seat_type=s_type,
                    price_multiplier=multiplier
                ))
        Seat.objects.bulk_create(seats_to_create)

class Seat(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='seats')
    seat_number = models.CharField(max_length=10)
    row = models.PositiveIntegerField()
    column = models.PositiveIntegerField()
    deck = models.CharField(max_length=10, choices=DeckType.choices, default=DeckType.LOWER)
    seat_type = models.CharField(max_length=20, choices=SeatType.choices, default=SeatType.STANDARD)
    is_accessible = models.BooleanField(default=False, help_text="Wheelchair / Special assistance accessible")
    price_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('vehicle', 'seat_number', 'deck')
        ordering = ['deck', 'row', 'column']
        indexes = [
            models.Index(fields=['vehicle', 'seat_number']),
            models.Index(fields=['seat_type']),
        ]

    def __str__(self):
        return f"{self.vehicle.vehicle_number} - Seat {self.seat_number} ({self.seat_type})"
