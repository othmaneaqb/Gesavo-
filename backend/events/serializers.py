from rest_framework import serializers
from .models import Event
from users.serializers import UserSerializer
from core.access import ASSISTANT, accessible_cases, accessible_users
from core.validation import ensure_case_access, ensure_user_in_cabinet, request_user

class EventSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['case'].queryset = accessible_cases(request.user)
            self.fields['attendees'].queryset = accessible_users(
                request.user
            ).filter(is_active=True)

    class Meta:
        model = Event
        fields = '__all__'
        extra_kwargs = {
            'attendees': {'required': False},
        }
        read_only_fields = ('created_by', 'created_at', 'updated_at')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        user = request_user(self)
        case = attrs.get('case', getattr(self.instance, 'case', None))
        ensure_case_access(user, case)
        attendees = attrs.get('attendees')
        if attendees is not None:
            for attendee in attendees:
                ensure_user_in_cabinet(user, attendee, 'attendees')
            if user.role == ASSISTANT and {item.pk for item in attendees} != {user.pk}:
                raise serializers.ValidationError(
                    {'attendees': 'Assistants may only add themselves as attendees.'}
                )
        return attrs

class EventDetailSerializer(serializers.ModelSerializer):
    attendees = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')
