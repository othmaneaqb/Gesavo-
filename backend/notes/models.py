from django.db import models
from django.conf import settings
from cases.models import Case
from clients.models import Client

class Note(models.Model):
    title = models.CharField(max_length=200, blank=True, null=True)
    content = models.TextField()
    
    # Relationships (A note can be attached to a Case OR a Client, or neither)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='case_notes', blank=True, null=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='client_notes', blank=True, null=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='authored_notes')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title if self.title else f"Note by {self.author} on {self.created_at.strftime('%Y-%m-%d')}"

    class Meta:
        ordering = ['-created_at']
