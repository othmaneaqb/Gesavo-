from rest_framework import serializers
from .models import Note
from users.serializers import UserSerializer

class NoteSerializer(serializers.ModelSerializer):
    # Set the author automatically based on the request user
    author = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Note
        fields = '__all__'

class NoteDetailSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Note
        fields = '__all__'
