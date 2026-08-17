from rest_framework import permissions

from .models import CustomUser
from core.access import same_cabinet


class IsAdministrator(permissions.BasePermission):
    message = 'Only administrators can manage user accounts.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or (
                    request.user.role == CustomUser.Role.ADMIN
                    and request.user.cabinet_id is not None
                )
            )
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view) and same_cabinet(request.user, obj)
