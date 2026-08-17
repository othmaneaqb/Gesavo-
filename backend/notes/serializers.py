from rest_framework import serializers
from .models import Note
from users.serializers import UserSerializer
from core.validation import validate_case_client_links
from core.access import accessible_cases, accessible_clients

class NoteSerializer(serializers.ModelSerializer):
    # Set the author automatically based on the request user
    author = serializers.PrimaryKeyRelatedField(read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['case'].queryset = accessible_cases(request.user)
            self.fields['client'].queryset = accessible_clients(request.user)

    class Meta:
        model = Note
        fields = '__all__'
        read_only_fields = ('author', 'created_at', 'updated_at')

    def validate(self, attrs):
        return validate_case_client_links(self, super().validate(attrs))

class NoteDetailSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Note
        fields = '__all__'
        read_only_fields = ('author', 'created_at', 'updated_at')
