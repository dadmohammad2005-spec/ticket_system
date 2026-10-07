from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)

    class Meta:
        verbose_name_plural = 'Countries'
        ordering = ['name']

    def __str__(self):
        return self.name

class City(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='cities')
    name = models.CharField(max_length=100)
    state_province = models.CharField(max_length=100, blank=True)
    code = models.CharField(max_length=10, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    is_popular = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Cities'
        unique_together = ('country', 'name')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_popular']),
        ]

    def __str__(self):
        return f"{self.name}, {self.country.code}"

class Station(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='stations')
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, unique=True)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    contact_number = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['city', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.city.name}"
