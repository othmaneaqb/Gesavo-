from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer, TaskDetailSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return TaskDetailSerializer
        return TaskSerializer

    def get_queryset(self):
        archive_cutoff = timezone.now() - timedelta(hours=48)
        Task.objects.filter(
            status=Task.Status.COMPLETED,
            is_archived=False,
            completed_at__isnull=False,
            completed_at__lte=archive_cutoff,
        ).update(is_archived=True, archived_at=timezone.now())
        return super().get_queryset()

    def perform_update(self, serializer):
        previous_status = self.get_object().status
        task = serializer.save()
        if task.status == Task.Status.COMPLETED and previous_status != Task.Status.COMPLETED:
            task.completed_at = timezone.now()
            task.is_archived = False
            task.archived_at = None
            task.save(update_fields=['completed_at', 'is_archived', 'archived_at'])
        elif task.status != Task.Status.COMPLETED:
            task.completed_at = None
            task.is_archived = False
            task.archived_at = None
            task.save(update_fields=['completed_at', 'is_archived', 'archived_at'])

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        task = self.get_object()
        task.status = Task.Status.IN_PROGRESS
        task.is_archived = False
        task.archived_at = None
        task.completed_at = None
        task.save(update_fields=['status', 'is_archived', 'archived_at', 'completed_at'])
        serializer = self.get_serializer(task)
        return Response(serializer.data)
