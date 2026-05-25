from django.db import models
from django.conf import settings
from cases.models import Case

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    court = models.CharField(max_length=200, blank=True, null=True)
    outcome = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='UPCOMING')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    # Relationships
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='events', blank=True, null=True)
    attendees = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='events', blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"

    class Meta:
        ordering = ['start_time']
