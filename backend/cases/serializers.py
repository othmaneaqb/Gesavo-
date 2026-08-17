from rest_framework import serializers
from .models import Case
from clients.serializers import ClientSerializer
from users.serializers import UserSerializer
from core.access import LAWYER, accessible_clients, accessible_users
from core.validation import ensure_client_access, ensure_user_in_cabinet, request_user

class CaseSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['client'].queryset = accessible_clients(request.user)
            self.fields['assigned_lawyers'].queryset = accessible_users(
                request.user
            ).filter(role=LAWYER, is_active=True)

    class Meta:
        model = Case
        fields = '__all__'
        extra_kwargs = {
            'assigned_lawyers': {'required': False},
        }
        read_only_fields = ('created_by', 'created_at', 'updated_at')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        user = request_user(self)
        client = attrs.get('client', getattr(self.instance, 'client', None))
        ensure_client_access(user, client)

        lawyers = attrs.get('assigned_lawyers')
        if lawyers is not None:
            for lawyer in lawyers:
                ensure_user_in_cabinet(user, lawyer, 'assigned_lawyers')
                if lawyer.role != LAWYER:
                    raise serializers.ValidationError(
                        {'assigned_lawyers': 'Only lawyers can be assigned to a case.'}
                    )
            if not user.is_superuser and user.role == LAWYER and {
                lawyer.pk for lawyer in lawyers
            } != {user.pk}:
                raise serializers.ValidationError(
                    {'assigned_lawyers': 'Lawyers may only assign the case to themselves.'}
                )
        return attrs

class CaseDetailSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    assigned_lawyers = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Case
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')
