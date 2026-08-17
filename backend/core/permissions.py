from rest_framework import permissions

from .access import same_cabinet


class CabinetObjectPermission(permissions.BasePermission):
    """Role gate plus an explicit object-level cabinet/ownership check."""

    message = 'You do not have permission to access this cabinet object.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.is_superuser and not user.cabinet_id:
            return False

        allowed = getattr(view, 'allowed_roles', None)
        if not allowed or user.is_superuser:
            return True
        roles = allowed.get(getattr(view, 'action', None), allowed.get('*', ()))
        return user.role in roles

    def has_object_permission(self, request, view, obj):
        if not same_cabinet(request.user, obj):
            return False

        # Detail lookups already use a filtered queryset. Keep the explicit
        # ownership check here as defence in depth for custom actions.
        if not view.get_queryset().filter(pk=obj.pk).exists():
            return False

        if request.method not in permissions.SAFE_METHODS:
            checker = getattr(view, 'can_modify_object', None)
            if checker is not None:
                return checker(request.user, obj)
        return True
