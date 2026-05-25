from rest_framework import serializers
from .models import Case
from clients.serializers import ClientSerializer
from users.serializers import UserSerializer

class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = '__all__'
        extra_kwargs = {
            'assigned_lawyers': {'required': False},
        }

class CaseDetailSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    assigned_lawyers = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Case
        fields = '__all__'
