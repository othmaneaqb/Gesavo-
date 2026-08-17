from django.http import FileResponse
from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from core.access import (
    ADMIN,
    ASSISTANT,
    LAWYER,
    accessible_document_audit,
    accessible_documents,
    is_admin,
)
from core.permissions import CabinetObjectPermission
from .models import Document, DocumentAuditLog
from .serializers import DocumentAuditLogSerializer, DocumentSerializer
from .services import audit_document_action, document_snapshot

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [CabinetObjectPermission]
    allowed_roles = {'*': (ADMIN, LAWYER, ASSISTANT)}

    def get_queryset(self):
        return accessible_documents(self.request.user)

    @transaction.atomic
    def perform_create(self, serializer):
        metadata = serializer.validated_file_metadata
        document = None
        try:
            document = serializer.save(
                uploaded_by=self.request.user,
                **metadata,
            )
            audit_document_action(
                document,
                DocumentAuditLog.Action.CREATE,
                self.request.user,
                request=self.request,
                after=document_snapshot(document),
            )
        except Exception:
            if document and document.file.name:
                document.file.storage.delete(document.file.name)
            raise

    @transaction.atomic
    def perform_update(self, serializer):
        document = Document.objects.select_for_update().get(pk=serializer.instance.pk)
        serializer.instance = document
        before = document_snapshot(document)
        old_name = document.file.name
        metadata = getattr(serializer, 'validated_file_metadata', None)
        new_name = None
        try:
            document = serializer.save(**(metadata or {}))
            new_name = document.file.name
            audit_document_action(
                document,
                DocumentAuditLog.Action.UPDATE,
                self.request.user,
                request=self.request,
                before=before,
                after=document_snapshot(document),
            )
        except Exception:
            replacement_name = new_name or document.file.name
            if metadata and replacement_name and replacement_name != old_name:
                document.file.storage.delete(replacement_name)
            raise
        if metadata and old_name and old_name != document.file.name:
            storage = document.file.storage
            transaction.on_commit(lambda: storage.delete(old_name))

    @transaction.atomic
    def perform_destroy(self, instance):
        document = Document.objects.select_for_update().get(pk=instance.pk)
        stored_name = document.file.name
        storage = document.file.storage
        audit_document_action(
            document,
            DocumentAuditLog.Action.DELETE,
            self.request.user,
            request=self.request,
            before=document_snapshot(document),
        )
        document.delete()
        if stored_name:
            transaction.on_commit(lambda: storage.delete(stored_name))

    def can_modify_object(self, user, document):
        if is_admin(user) or user.role == LAWYER:
            return True
        return document.uploaded_by_id == user.pk

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        document = self.get_object()
        try:
            file_handle = document.file.open('rb')
        except (FileNotFoundError, OSError) as exc:
            raise NotFound('Document file is unavailable.') from exc
        try:
            with transaction.atomic():
                audit_document_action(
                    document,
                    DocumentAuditLog.Action.DOWNLOAD,
                    request.user,
                    request=request,
                    after=document_snapshot(document),
                )
        except Exception:
            file_handle.close()
            raise

        response = FileResponse(
            file_handle,
            as_attachment=True,
            filename=document.original_filename,
            content_type=document.mime_type,
        )
        response['Cache-Control'] = 'private, no-store'
        response['Pragma'] = 'no-cache'
        return response


class DocumentAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentAuditLog.objects.all()
    serializer_class = DocumentAuditLogSerializer
    permission_classes = [CabinetObjectPermission]
    allowed_roles = {'*': (ADMIN, LAWYER, ASSISTANT)}

    def get_queryset(self):
        return accessible_document_audit(self.request.user)
