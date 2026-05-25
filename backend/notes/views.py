from rest_framework import viewsets, permissions
from .models import Note
from .serializers import NoteSerializer, NoteDetailSerializer

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return NoteDetailSerializer
        return NoteSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
