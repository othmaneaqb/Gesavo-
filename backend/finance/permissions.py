from rest_framework import permissions

from users.models import CustomUser


class IsLawyerOrAdministrator(permissions.BasePermission):
    """
    Finance is available to lawyers and administrators, never assistants.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.role
                in {CustomUser.Role.ADMIN, CustomUser.Role.LAWYER}
            )
        )
