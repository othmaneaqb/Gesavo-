from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        LAWYER = 'LAWYER', 'Lawyer'
        ASSISTANT = 'ASSISTANT', 'Assistant'
    
    role = models.CharField(
        max_length=20, 
        choices=Role.choices, 
        default=Role.ASSISTANT,
        help_text="Lawyers have full access, Assistants do not have access to finance."
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
