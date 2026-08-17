from rest_framework import serializers

from .access import accessible_cases, accessible_clients, cabinet_id_for, is_break_glass


def request_user(serializer):
    request = serializer.context.get('request')
    if request is None or not request.user.is_authenticated:
        raise serializers.ValidationError({'detail': 'Authentication is required.'})
    return request.user


def ensure_client_access(user, client, field='client'):
    if client and not accessible_clients(user).filter(pk=client.pk).exists():
        raise serializers.ValidationError({field: 'Client is outside your authorized scope.'})


def ensure_case_access(user, case, field='case'):
    if case and not accessible_cases(user).filter(pk=case.pk).exists():
        raise serializers.ValidationError({field: 'Case is outside your authorized scope.'})


def ensure_user_in_cabinet(user, related_user, field):
    if related_user is None:
        return
    if not is_break_glass(user) and related_user.cabinet_id != cabinet_id_for(user):
        raise serializers.ValidationError({field: 'User belongs to another cabinet.'})
    if not related_user.is_active:
        raise serializers.ValidationError({field: 'User account is inactive.'})


def validate_case_client_links(serializer, attrs):
    user = request_user(serializer)
    case = attrs.get('case', getattr(serializer.instance, 'case', None))
    client = attrs.get('client', getattr(serializer.instance, 'client', None))
    ensure_case_access(user, case)
    ensure_client_access(user, client)
    if case and client and case.client_id != client.pk:
        raise serializers.ValidationError(
            {'client': 'Client must be the client attached to the selected case.'}
        )
    return attrs
