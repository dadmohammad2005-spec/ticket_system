from django.db import models
from django.utils.text import slugify

class Operator(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    code = models.CharField(max_length=20, unique=True, help_text="Short operator code like APX, HZN, VLV")
    logo_url = models.URLField(max_length=500, blank=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=30)
    website = models.URLField(blank=True)
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.8)
    total_reviews = models.PositiveIntegerField(default=0)
    
    is_verified = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    
    cancellation_policy = models.TextField(
        default="Full refund if cancelled 24+ hours before departure. 50% refund if cancelled 12-24 hours before. No refund within 12 hours of departure."
    )
    terms_and_conditions = models.TextField(
        default="Passengers must present valid government ID matching the ticket name upon boarding. Arrive at terminal 30 minutes prior to departure."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-rating', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
            models.Index(fields=['rating']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"
