from rest_framework import viewsets
from core.access import ADMIN, ASSISTANT, LAWYER, accessible_events, is_admin
from core.permissions import CabinetObjectPermission
from .models import Event
from .serializers import EventSerializer, EventDetailSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    permission_classes = [CabinetObjectPermission]
    allowed_roles = {'*': (ADMIN, LAWYER, ASSISTANT)}

    def get_queryset(self):
        return accessible_events(self.request.user).prefetch_related('attendees')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return EventDetailSerializer
        return EventSerializer

    def perform_create(self, serializer):
        event = serializer.save(created_by=self.request.user)
        if self.request.user.role == ASSISTANT:
            event.attendees.add(self.request.user)

    def can_modify_object(self, user, event):
        if is_admin(user) or user.role == LAWYER:
            return True
        return event.created_by_id == user.pk or event.attendees.filter(pk=user.pk).exists()
