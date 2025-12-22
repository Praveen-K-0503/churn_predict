from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='manager')
    cognito_id = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"