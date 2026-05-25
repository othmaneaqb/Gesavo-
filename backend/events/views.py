from rest_framework import viewsets, permissions
from .models import Event
from .serializers import EventSerializer, EventDetailSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return EventDetailSerializer
        return EventSerializer
