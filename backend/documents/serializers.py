from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ('uploaded_by', 'uploaded_at')
