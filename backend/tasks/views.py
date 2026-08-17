from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer, TaskDetailSerializer
from core.access import ADMIN, ASSISTANT, LAWYER, accessible_tasks, is_admin
from core.permissions import CabinetObjectPermission

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    permission_classes = [CabinetObjectPermission]
    allowed_roles = {'*': (ADMIN, LAWYER, ASSISTANT)}

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return TaskDetailSerializer
        return TaskSerializer

    def get_queryset(self):
        return accessible_tasks(self.request.user)

    def perform_create(self, serializer):
        defaults = {'created_by': self.request.user}
        if self.request.user.role == ASSISTANT and not serializer.validated_data.get('assigned_to'):
            defaults['assigned_to'] = self.request.user
        serializer.save(**defaults)

    def can_modify_object(self, user, task):
        if is_admin(user) or user.role == LAWYER:
            return True
        return task.created_by_id == user.pk or task.assigned_to_id == user.pk

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
