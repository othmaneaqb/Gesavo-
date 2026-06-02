from django.db import models
from django.conf import settings
from cases.models import Case
from clients.models import Client

class Document(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    description = models.TextField(blank=True, null=True)
    
    # Relationships
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='documents', blank=True, null=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='documents', blank=True, null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        old_file = None
        if self.pk:
            old_file = Document.objects.filter(pk=self.pk).values_list('file', flat=True).first()

        super().save(*args, **kwargs)

        if old_file and old_file != self.file.name:
            storage = self.file.storage
            if storage.exists(old_file):
                storage.delete(old_file)

    def delete(self, *args, **kwargs):
        storage = self.file.storage
        file_name = self.file.name
        super().delete(*args, **kwargs)
        if file_name and storage.exists(file_name):
            storage.delete(file_name)

    class Meta:
        ordering = ['-uploaded_at']
