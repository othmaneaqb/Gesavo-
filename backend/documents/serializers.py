from rest_framework import serializers
from rest_framework.reverse import reverse
from .models import Document, DocumentAuditLog
from .security import inspect_document_upload
from core.validation import validate_case_client_links
from core.access import accessible_cases, accessible_clients

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    file = serializers.FileField(write_only=True)
    download_url = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['case'].queryset = accessible_cases(request.user)
            self.fields['client'].queryset = accessible_clients(request.user)

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = (
            'uploaded_by', 'uploaded_at', 'original_filename', 'mime_type',
            'size', 'sha256',
        )

    def get_download_url(self, obj):
        request = self.context.get('request')
        return reverse('document-download', kwargs={'pk': obj.pk}, request=request)

    def validate_file(self, value):
        self.validated_file_metadata = inspect_document_upload(value)
        return value

    def validate(self, attrs):
        return validate_case_client_links(self, super().validate(attrs))

    def create(self, validated_data):
        document = Document(**validated_data)
        try:
            document.save()
        except Exception:
            if document.file and document.file.name:
                document.file.storage.delete(document.file.name)
            raise
        return document

    def update(self, instance, validated_data):
        previous_name = instance.file.name
        is_replacement = 'file' in validated_data
        try:
            return super().update(instance, validated_data)
        except Exception:
            replacement_name = instance.file.name
            if is_replacement and replacement_name and replacement_name != previous_name:
                instance.file.storage.delete(replacement_name)
            raise


class DocumentAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = DocumentAuditLog
        fields = (
            'id', 'cabinet', 'actor', 'actor_name', 'client', 'case',
            'document_id', 'action', 'original_filename', 'mime_type', 'size',
            'sha256', 'before', 'after', 'ip_address', 'user_agent', 'created_at',
        )
        read_only_fields = fields
