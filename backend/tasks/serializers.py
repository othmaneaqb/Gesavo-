from rest_framework import serializers
from .models import Task
from users.serializers import UserSerializer

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class TaskDetailSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
