from datetime import timedelta
from io import StringIO

from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from cases.models import Case
from clients.models import Client
from users.models import Cabinet, CustomUser

from .models import Task


class TaskArchiveTests(APITestCase):
    PASSWORD = 'TaskArchive#2026!'

    @classmethod
    def setUpTestData(cls):
        cls.cabinet = Cabinet.objects.create(
            name='Task Archive Cabinet', slug='task-archive-cabinet'
        )
        cls.lawyer = CustomUser.objects.create_user(
            username='task_archive_lawyer',
            email='task.archive@example.test',
            password=cls.PASSWORD,
            role=CustomUser.Role.LAWYER,
            cabinet=cls.cabinet,
        )
        cls.client_record = Client.objects.create(
            cabinet=cls.cabinet,
            created_by=cls.lawyer,
            first_name='Archive',
            last_name='Client',
        )
        cls.case = Case.objects.create(
            client=cls.client_record,
            created_by=cls.lawyer,
            title='Archive case',
        )
        cls.case.assigned_lawyers.add(cls.lawyer)

    def create_task(self, title, *, status_value=Task.Status.COMPLETED, age_hours=49):
        return Task.objects.create(
            title=title,
            status=status_value,
            completed_at=timezone.now() - timedelta(hours=age_hours),
            case=self.case,
            created_by=self.lawyer,
            assigned_to=self.lawyer,
        )

    def test_get_requests_do_not_mutate_archive_state(self):
        eligible = self.create_task('Eligible but not archived by GET')
        self.client.force_authenticate(user=self.lawyer)

        response = self.client.get('/api/tasks/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        eligible.refresh_from_db()
        self.assertFalse(eligible.is_archived)
        self.assertIsNone(eligible.archived_at)

    def test_management_command_archives_only_eligible_tasks_and_is_idempotent(self):
        eligible = self.create_task('Old completed task')
        recent = self.create_task('Recent completed task', age_hours=47)
        active = self.create_task(
            'Old active task',
            status_value=Task.Status.IN_PROGRESS,
            age_hours=72,
        )
        output = StringIO()

        call_command('archive_completed_tasks', stdout=output)

        eligible.refresh_from_db()
        recent.refresh_from_db()
        active.refresh_from_db()
        self.assertTrue(eligible.is_archived)
        self.assertIsNotNone(eligible.archived_at)
        self.assertFalse(recent.is_archived)
        self.assertFalse(active.is_archived)
        self.assertIn('Archived 1 completed task(s).', output.getvalue())

        second_output = StringIO()
        call_command('archive_completed_tasks', stdout=second_output)
        self.assertIn('Archived 0 completed task(s).', second_output.getvalue())

    def test_archived_task_can_be_restored_through_the_existing_api(self):
        task = self.create_task('Restore scheduled archive')
        call_command('archive_completed_tasks', stdout=StringIO())
        self.client.force_authenticate(user=self.lawyer)

        response = self.client.post(f'/api/tasks/{task.pk}/restore/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.IN_PROGRESS)
        self.assertFalse(task.is_archived)
        self.assertIsNone(task.archived_at)
        self.assertIsNone(task.completed_at)

    def test_command_rejects_invalid_retention(self):
        with self.assertRaises(CommandError):
            call_command('archive_completed_tasks', older_than_hours=0)
