from rest_framework import viewsets
from core.access import ADMIN, ASSISTANT, LAWYER, accessible_cases
from core.permissions import CabinetObjectPermission
from .models import Case
from .serializers import CaseSerializer, CaseDetailSerializer

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    permission_classes = [CabinetObjectPermission]
    allowed_roles = {
        'list': (ADMIN, LAWYER, ASSISTANT),
        'retrieve': (ADMIN, LAWYER, ASSISTANT),
        'create': (ADMIN, LAWYER),
        'update': (ADMIN, LAWYER),
        'partial_update': (ADMIN, LAWYER),
        'destroy': (ADMIN, LAWYER),
    }

    def get_queryset(self):
        return accessible_cases(self.request.user).prefetch_related('assigned_lawyers')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return CaseDetailSerializer
        return CaseSerializer

    def perform_create(self, serializer):
        case = serializer.save(created_by=self.request.user)
        if self.request.user.role == LAWYER:
            case.assigned_lawyers.add(self.request.user)
