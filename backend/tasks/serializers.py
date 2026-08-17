from rest_framework import serializers
from .models import Task
from users.serializers import UserSerializer
from core.access import ASSISTANT, accessible_cases, accessible_users
from core.validation import ensure_case_access, ensure_user_in_cabinet, request_user

class TaskSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['case'].queryset = accessible_cases(request.user)
            self.fields['assigned_to'].queryset = accessible_users(
                request.user
            ).filter(is_active=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = (
            'created_by', 'created_at', 'updated_at', 'completed_at',
            'archived_at', 'is_archived',
        )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        user = request_user(self)
        case = attrs.get('case', getattr(self.instance, 'case', None))
        ensure_case_access(user, case)
        assignee = attrs.get('assigned_to', getattr(self.instance, 'assigned_to', None))
        ensure_user_in_cabinet(user, assignee, 'assigned_to')
        if user.role == ASSISTANT:
            invalid_assignee = assignee is not None and assignee.pk != user.pk
            removes_self = self.instance is not None and 'assigned_to' in attrs and assignee is None
            if invalid_assignee or removes_self:
                raise serializers.ValidationError(
                    {'assigned_to': 'Assistants may only assign tasks to themselves.'}
                )
        return attrs

class TaskDetailSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = (
            'created_by', 'created_at', 'updated_at', 'completed_at',
            'archived_at', 'is_archived',
        )
