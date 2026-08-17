from rest_framework import viewsets
from core.access import ADMIN, ASSISTANT, LAWYER, accessible_clients
from core.permissions import CabinetObjectPermission
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
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
        return accessible_clients(self.request.user)

    def perform_create(self, serializer):
        serializer.save(
            cabinet=self.request.user.cabinet,
            created_by=self.request.user,
        )
