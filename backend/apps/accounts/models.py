from django.db import models
from django.contrib.auth.models import AbstractUser

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrator'
    OPERATOR = 'OPERATOR', 'Operator / Staff'
    CUSTOMER = 'CUSTOMER', 'Customer'

class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    phone_number = models.CharField(max_length=25, blank=True)
    id_card_number = models.CharField(max_length=50, blank=True, help_text='CNIC or Passport Number')
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.email}) - {self.role}"
    
    @property
    def is_admin_role(self):
        return self.role == UserRole.ADMIN or self.is_superuser
        
    @property
    def is_operator_role(self):
        return self.role in [UserRole.ADMIN, UserRole.OPERATOR] or self.is_staff
