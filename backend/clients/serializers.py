from rest_framework import serializers
from .models import Client

class ClientSerializer(serializers.ModelSerializer):
    def validate_email(self, value):
        return value or None

    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ('cabinet', 'created_by', 'created_at', 'updated_at')
