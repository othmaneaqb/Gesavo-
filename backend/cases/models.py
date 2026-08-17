from django.db import models
from django.conf import settings
from clients.models import Client

class Case(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        PENDING = 'PENDING', 'Pending'
        CLOSED = 'CLOSED', 'Closed'
        
    title = models.CharField(max_length=200)
    case_number = models.CharField(max_length=100, blank=True, null=True)
    case_type = models.CharField(max_length=50, blank=True, null=True)
    court = models.CharField(max_length=200, blank=True, null=True)
    judge = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    next_hearing = models.DateField(blank=True, null=True)
    
    # Relationships
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='cases')
    assigned_lawyers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='assigned_cases')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='created_cases',
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.client}"

    class Meta:
        ordering = ['-created_at']
