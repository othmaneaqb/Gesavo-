from rest_framework import viewsets
from core.access import ADMIN, ASSISTANT, LAWYER, accessible_notes, is_admin
from core.permissions import CabinetObjectPermission
from .models import Note
from .serializers import NoteSerializer, NoteDetailSerializer

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    permission_classes = [CabinetObjectPermission]
    allowed_roles = {'*': (ADMIN, LAWYER, ASSISTANT)}

    def get_queryset(self):
        return accessible_notes(self.request.user)

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return NoteDetailSerializer
        return NoteSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def can_modify_object(self, user, note):
        if is_admin(user) or user.role == LAWYER:
            return True
        return note.author_id == user.pk
