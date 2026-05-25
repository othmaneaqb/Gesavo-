from rest_framework import permissions

class IsLawyer(permissions.BasePermission):
    """
    Custom permission to only allow Lawyers to access finance data.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'LAWYER')
