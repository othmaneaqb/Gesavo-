from rest_framework import serializers
from .models import Event
from users.serializers import UserSerializer

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        extra_kwargs = {
            'attendees': {'required': False},
        }

class EventDetailSerializer(serializers.ModelSerializer):
    attendees = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
