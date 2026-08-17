import hashlib
import uuid
from pathlib import PurePath

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import migrations, models
import django.db.models.deletion
import documents.models
import documents.storage


def migrate_historical_documents(apps, schema_editor):
    Document = apps.get_model('documents', 'Document')
    from documents.security import inspect_document_content, sanitize_filename
    from documents.storage import PrivateDocumentStorage

    private_storage = PrivateDocumentStorage()
    alias = schema_editor.connection.alias

    for document in Document.objects.using(alias).select_related(
        'case__client__cabinet', 'client__cabinet', 'uploaded_by__cabinet'
    ):
        old_name = document.file.name
        source_storage = document.file.storage

        # Makes a non-atomic filesystem migration safe to resume after a
        # process interruption once a database row already points privately.
        if private_storage.exists(old_name):
            with private_storage.open(old_name, 'rb') as source:
                content = source.read()
            original_name = document.original_filename or PurePath(old_name).name
            metadata = inspect_document_content(content, original_name)
            Document.objects.using(alias).filter(pk=document.pk).update(
                original_filename=metadata['original_filename'],
                mime_type=metadata['mime_type'],
                size=metadata['size'],
                sha256=metadata['sha256'],
            )
            continue

        if not source_storage.exists(old_name):
            raise RuntimeError(
                f'Document #{document.pk} references a missing historical file: {old_name}'
            )
        with source_storage.open(old_name, 'rb') as source:
            content = source.read()
        if len(content) > settings.DOCUMENT_MAX_UPLOAD_SIZE:
            raise RuntimeError(
                f'Document #{document.pk} exceeds the configured private upload limit.'
            )

        source_suffix = PurePath(old_name).suffix.lower()
        preferred_name = document.title or PurePath(old_name).name
        if PurePath(preferred_name).suffix.lower() != source_suffix:
            preferred_name = PurePath(old_name).name
        metadata = inspect_document_content(content, preferred_name)

        if document.case_id:
            cabinet_id = document.case.client.cabinet_id
        elif document.client_id:
            cabinet_id = document.client.cabinet_id
        elif document.uploaded_by_id:
            cabinet_id = document.uploaded_by.cabinet_id
        else:
            raise RuntimeError(f'Document #{document.pk} has no cabinet scope.')

        suffix = metadata['extension']
        safe_name = sanitize_filename(metadata['original_filename'])
        stem = safe_name[:-len(suffix)] if suffix else safe_name
        uploaded_at = document.uploaded_at
        target_name = (
            f'documents/{cabinet_id}/{uploaded_at:%Y/%m}/'
            f'{uuid.uuid4().hex}_{stem[:80]}{suffix}'
        )
        target_name = private_storage.save(target_name, ContentFile(content))

        with private_storage.open(target_name, 'rb') as copied:
            copied_hash = hashlib.sha256(copied.read()).hexdigest()
        if copied_hash != metadata['sha256']:
            private_storage.delete(target_name)
            raise RuntimeError(f'Private copy verification failed for document #{document.pk}.')

        Document.objects.using(alias).filter(pk=document.pk).update(
            file=target_name,
            original_filename=metadata['original_filename'],
            mime_type=metadata['mime_type'],
            size=metadata['size'],
            sha256=metadata['sha256'],
        )
        # The row update is autocommitted before removing the legacy copy.
        # FileSystemStorage.delete is safe when the source was already absent.
        try:
            source_storage.delete(old_name)
        except OSError:
            # The database already points to a verified private copy. A failed
            # legacy cleanup is non-fatal and can be handled operationally.
            pass


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0003_cabinet_and_membership'),
        ('clients', '0003_client_cabinet_and_owner'),
        ('cases', '0003_case_owner'),
        ('documents', '0002_document_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='original_filename',
            field=models.CharField(default='', editable=False, max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='document',
            name='mime_type',
            field=models.CharField(default='', editable=False, max_length=150),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='document',
            name='size',
            field=models.PositiveBigIntegerField(default=0, editable=False),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='document',
            name='sha256',
            field=models.CharField(default='', editable=False, max_length=64),
            preserve_default=False,
        ),
        migrations.RunPython(
            migrate_historical_documents,
            migrations.RunPython.noop,
            atomic=False,
        ),
        migrations.AlterField(
            model_name='document',
            name='file',
            field=models.FileField(
                storage=documents.storage.PrivateDocumentStorage(),
                upload_to=documents.models.document_upload_path,
            ),
        ),
        migrations.CreateModel(
            name='DocumentAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_id', models.PositiveBigIntegerField()),
                ('action', models.CharField(choices=[('CREATE', 'Create'), ('UPDATE', 'Update'), ('DOWNLOAD', 'Download'), ('DELETE', 'Delete')], max_length=10)),
                ('original_filename', models.CharField(max_length=255)),
                ('mime_type', models.CharField(max_length=150)),
                ('size', models.PositiveBigIntegerField()),
                ('sha256', models.CharField(max_length=64)),
                ('before', models.JSONField(blank=True, default=dict)),
                ('after', models.JSONField(blank=True, default=dict)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.CharField(blank=True, max_length=512)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='document_audit_actions', to=settings.AUTH_USER_MODEL)),
                ('cabinet', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='document_audit_logs', to='users.cabinet')),
                ('case', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='document_audit_logs', to='cases.case')),
                ('client', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='document_audit_logs', to='clients.client')),
            ],
            options={
                'ordering': ('-created_at', '-id'),
                'indexes': [
                    models.Index(fields=['cabinet', 'document_id'], name='documents_audit_document_idx'),
                    models.Index(fields=['cabinet', 'created_at'], name='documents_audit_created_idx'),
                ],
            },
        ),
    ]
