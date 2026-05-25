from rest_framework import viewsets, permissions
from .models import Case
from .serializers import CaseSerializer, CaseDetailSerializer

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return CaseDetailSerializer
        return CaseSerializer
