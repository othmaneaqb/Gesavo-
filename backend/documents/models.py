import uuid
from pathlib import PurePath

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from cases.models import Case
from clients.models import Client
from users.models import Cabinet

from .security import sanitize_filename
from .storage import private_document_storage


def document_upload_path(instance, filename):
    safe_name = sanitize_filename(filename)
    suffix = PurePath(safe_name).suffix.lower()
    stem = safe_name[:-len(suffix)] if suffix else safe_name
    cabinet_id = None
    if instance.uploaded_by_id:
        cabinet_id = instance.uploaded_by.cabinet_id
    elif instance.case_id:
        cabinet_id = instance.case.client.cabinet_id
    elif instance.client_id:
        cabinet_id = instance.client.cabinet_id
    cabinet_segment = str(cabinet_id or 'unscoped')
    now = timezone.now()
    return (
        f'documents/{cabinet_segment}/{now:%Y/%m}/'
        f'{uuid.uuid4().hex}_{stem[:80]}{suffix}'
    )

class Document(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(
        upload_to=document_upload_path,
        storage=private_document_storage,
    )
    original_filename = models.CharField(max_length=255, editable=False)
    mime_type = models.CharField(max_length=150, editable=False)
    size = models.PositiveBigIntegerField(editable=False)
    sha256 = models.CharField(max_length=64, editable=False)
    description = models.TextField(blank=True, null=True)
    
    # Relationships
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='documents', blank=True, null=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='documents', blank=True, null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-uploaded_at']


class DocumentAuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DOWNLOAD = 'DOWNLOAD', 'Download'
        DELETE = 'DELETE', 'Delete'

    cabinet = models.ForeignKey(
        Cabinet,
        on_delete=models.PROTECT,
        related_name='document_audit_logs',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='document_audit_actions',
        blank=True,
        null=True,
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        related_name='document_audit_logs',
        blank=True,
        null=True,
    )
    case = models.ForeignKey(
        Case,
        on_delete=models.SET_NULL,
        related_name='document_audit_logs',
        blank=True,
        null=True,
    )
    document_id = models.PositiveBigIntegerField()
    action = models.CharField(max_length=10, choices=Action.choices)
    original_filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=150)
    size = models.PositiveBigIntegerField()
    sha256 = models.CharField(max_length=64)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at', '-id')
        indexes = [
            models.Index(
                fields=('cabinet', 'document_id'),
                name='documents_audit_document_idx',
            ),
            models.Index(
                fields=('cabinet', 'created_at'),
                name='documents_audit_created_idx',
            ),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError('Document audit records are immutable.')
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError('Document audit records are immutable.')

    def __str__(self):
        return f'{self.action} document #{self.document_id}'
