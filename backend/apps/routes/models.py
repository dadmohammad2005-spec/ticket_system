from django.db import models
from apps.locations.models import City, Station

class Route(models.Model):
    origin_city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='routes_origin')
    destination_city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='routes_destination')
    origin_station = models.ForeignKey(Station, on_delete=models.SET_NULL, null=True, blank=True, related_name='routes_origin_station')
    destination_station = models.ForeignKey(Station, on_delete=models.SET_NULL, null=True, blank=True, related_name='routes_dest_station')
    
    distance_km = models.DecimalField(max_digits=7, decimal_places=2, help_text="Total road/rail distance in km")
    estimated_duration_minutes = models.PositiveIntegerField(help_text="Estimated travel duration in minutes")
    
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('origin_city', 'destination_city', 'origin_station', 'destination_station')
        ordering = ['origin_city', 'destination_city']
        indexes = [
            models.Index(fields=['origin_city', 'destination_city']),
            models.Index(fields=['is_popular']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.origin_city.name} → {self.destination_city.name} ({self.duration_formatted})"

    @property
    def duration_formatted(self):
        hours = self.estimated_duration_minutes // 60
        minutes = self.estimated_duration_minutes % 60
        if hours > 0 and minutes > 0:
            return f"{hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h"
        return f"{minutes}m"
