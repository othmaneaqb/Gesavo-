from django.contrib import admin
from .models import Document, DocumentAuditLog

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'original_filename', 'mime_type', 'size', 'case', 'client',
        'uploaded_by', 'uploaded_at',
    )
    list_filter = ('uploaded_at',)
    search_fields = ('title', 'case__title', 'client__first_name', 'client__last_name', 'uploaded_by__username')
    readonly_fields = (
        'title', 'file', 'original_filename', 'mime_type', 'size', 'sha256',
        'description', 'case', 'client', 'uploaded_by', 'uploaded_at',
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(DocumentAuditLog)
class DocumentAuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'created_at', 'cabinet', 'actor', 'action', 'document_id',
        'original_filename', 'size',
    )
    list_filter = ('cabinet', 'action', 'mime_type', 'created_at')
    search_fields = ('actor__username', 'original_filename', 'sha256')
    readonly_fields = (
        'cabinet', 'actor', 'client', 'case', 'document_id', 'action',
        'original_filename', 'mime_type', 'size', 'sha256', 'before', 'after',
        'ip_address', 'user_agent', 'created_at',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
