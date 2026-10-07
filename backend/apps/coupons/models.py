from django.db import models
from django.utils import timezone
from decimal import Decimal

class DiscountType(models.TextChoices):
    PERCENTAGE = 'PERCENTAGE', 'Percentage Discount (%)'
    FIXED = 'FIXED', 'Fixed Amount Discount ($)'

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE)
    discount_value = models.DecimalField(max_digits=7, decimal_places=2, help_text="e.g. 15.00 for 15% or $15")
    min_booking_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField()
    usage_limit = models.PositiveIntegerField(default=500)
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.code} ({self.discount_value}{'%' if self.discount_type == DiscountType.PERCENTAGE else '$'})"

    def is_valid_for_amount(self, amount):
        now = timezone.now()
        if not self.is_active:
            return False, "This coupon is no longer active."
        if now < self.valid_from:
            return False, "This coupon is not yet valid."
        if now > self.valid_to:
            return False, "This coupon has expired."
        if self.times_used >= self.usage_limit:
            return False, "This coupon has reached its maximum usage limit."
        if Decimal(str(amount)) < self.min_booking_amount:
            return False, f"Minimum booking amount of ${self.min_booking_amount} required to use this coupon."
        return True, "Valid coupon"

    def calculate_discount(self, amount):
        amt = Decimal(str(amount))
        valid, msg = self.is_valid_for_amount(amt)
        if not valid:
            return Decimal('0.00'), msg

        if self.discount_type == DiscountType.PERCENTAGE:
            disc = amt * (self.discount_value / Decimal('100.00'))
            if self.max_discount_amount and disc > self.max_discount_amount:
                disc = self.max_discount_amount
        else:
            disc = min(self.discount_value, amt)

        return round(disc, 2), "Discount applied successfully"
