from django.db import models
from django.conf import settings
from apps.trips.models import Trip
from apps.operators.models import Operator

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='reviews')
    operator = models.ForeignKey(Operator, on_delete=models.CASCADE, related_name='reviews')
    
    rating = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    cleanliness_rating = models.PositiveSmallIntegerField(default=5)
    punctuality_rating = models.PositiveSmallIntegerField(default=5)
    staff_rating = models.PositiveSmallIntegerField(default=5)
    
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'trip')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['operator', '-created_at']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return f"{self.user.email} -> {self.operator.name} ({self.rating}/5)"

    def update_operator_rating(self):
        avg = Review.objects.filter(operator=self.operator).aggregate(models.Avg('rating'))['rating__avg']
        count = Review.objects.filter(operator=self.operator).count()
        if avg:
            self.operator.rating = round(avg, 2)
            self.operator.total_reviews = count
            self.operator.save()
