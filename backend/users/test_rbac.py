import tempfile
import hashlib
from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from cases.models import Case
from clients.models import Client
from documents.models import Document
from events.models import Event
from finance.models import Transaction
from notes.models import Note
from tasks.models import Task
from users.models import Cabinet, CustomUser


class CabinetRbacTests(APITestCase):
    PASSWORD = 'R9!cabinet#Access2026'

    @classmethod
    def setUpClass(cls):
        cls._media_directory = tempfile.TemporaryDirectory()
        cls._media_override = override_settings(
            PRIVATE_DOCUMENT_ROOT=cls._media_directory.name
        )
        cls._media_override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._media_override.disable()
        cls._media_directory.cleanup()

    @classmethod
    def setUpTestData(cls):
        cls.cabinet_a = Cabinet.objects.create(name='Cabinet A', slug='cabinet-a')
        cls.cabinet_b = Cabinet.objects.create(name='Cabinet B', slug='cabinet-b')

        def user(username, role, cabinet):
            return CustomUser.objects.create_user(
                username=username,
                email=f'{username}@example.test',
                password=cls.PASSWORD,
                role=role,
                cabinet=cabinet,
            )

        cls.admin_a = user('admin_a', CustomUser.Role.ADMIN, cls.cabinet_a)
        cls.lawyer_a = user('lawyer_a', CustomUser.Role.LAWYER, cls.cabinet_a)
        cls.other_lawyer_a = user(
            'other_lawyer_a', CustomUser.Role.LAWYER, cls.cabinet_a
        )
        cls.assistant_a = user(
            'assistant_a', CustomUser.Role.ASSISTANT, cls.cabinet_a
        )
        cls.other_assistant_a = user(
            'other_assistant_a', CustomUser.Role.ASSISTANT, cls.cabinet_a
        )
        cls.admin_b = user('admin_b', CustomUser.Role.ADMIN, cls.cabinet_b)
        cls.lawyer_b = user('lawyer_b', CustomUser.Role.LAWYER, cls.cabinet_b)

        cls.client_a = Client.objects.create(
            cabinet=cls.cabinet_a,
            created_by=cls.lawyer_a,
            first_name='Authorized',
            last_name='Client A',
            email='shared@example.test',
        )
        cls.other_client_a = Client.objects.create(
            cabinet=cls.cabinet_a,
            created_by=cls.other_lawyer_a,
            first_name='Other',
            last_name='Client A',
        )
        cls.client_b = Client.objects.create(
            cabinet=cls.cabinet_b,
            created_by=cls.lawyer_b,
            first_name='Foreign',
            last_name='Client B',
            email='shared@example.test',
        )

        cls.case_a = Case.objects.create(
            client=cls.client_a, created_by=cls.lawyer_a, title='Authorized case'
        )
        cls.case_a.assigned_lawyers.add(cls.lawyer_a)
        cls.other_case_a = Case.objects.create(
            client=cls.other_client_a,
            created_by=cls.other_lawyer_a,
            title='Same cabinet but unassigned',
        )
        cls.other_case_a.assigned_lawyers.add(cls.other_lawyer_a)
        cls.case_b = Case.objects.create(
            client=cls.client_b, created_by=cls.lawyer_b, title='Foreign case'
        )
        cls.case_b.assigned_lawyers.add(cls.lawyer_b)

        cls.task_a = Task.objects.create(
            title='Assigned task',
            case=cls.case_a,
            created_by=cls.lawyer_a,
            assigned_to=cls.assistant_a,
        )
        cls.other_task_a = Task.objects.create(
            title='Other task',
            case=cls.other_case_a,
            created_by=cls.other_lawyer_a,
            assigned_to=cls.other_assistant_a,
        )
        cls.task_b = Task.objects.create(
            title='Foreign task', case=cls.case_b, created_by=cls.lawyer_b
        )

        now = timezone.now()
        cls.event_a = Event.objects.create(
            title='Assigned hearing',
            case=cls.case_a,
            created_by=cls.lawyer_a,
            start_time=now,
            end_time=now + timedelta(hours=1),
        )
        cls.event_a.attendees.add(cls.assistant_a)
        cls.other_event_a = Event.objects.create(
            title='Other hearing',
            case=cls.other_case_a,
            created_by=cls.other_lawyer_a,
            start_time=now,
            end_time=now + timedelta(hours=1),
        )
        cls.other_event_a.attendees.add(cls.other_assistant_a)
        cls.event_b = Event.objects.create(
            title='Foreign hearing',
            case=cls.case_b,
            created_by=cls.lawyer_b,
            start_time=now,
            end_time=now + timedelta(hours=1),
        )

        cls.note_a = Note.objects.create(
            title='Case note', content='Authorized context', case=cls.case_a,
            client=cls.client_a, author=cls.lawyer_a,
        )
        cls.other_note_a = Note.objects.create(
            title='Other note', content='Must not leak', case=cls.other_case_a,
            client=cls.other_client_a, author=cls.other_lawyer_a,
        )
        cls.note_b = Note.objects.create(
            title='Foreign note', content='Foreign cabinet context',
            case=cls.case_b, client=cls.client_b, author=cls.lawyer_b,
        )

        cls.document_a = Document.objects.create(
            title='authorized.txt',
            file=SimpleUploadedFile('authorized.txt', b'authorized'),
            original_filename='authorized.txt',
            mime_type='text/plain',
            size=len(b'authorized'),
            sha256=hashlib.sha256(b'authorized').hexdigest(),
            case=cls.case_a,
            client=cls.client_a,
            uploaded_by=cls.lawyer_a,
        )
        cls.other_document_a = Document.objects.create(
            title='other.txt',
            file=SimpleUploadedFile('other.txt', b'other'),
            original_filename='other.txt',
            mime_type='text/plain',
            size=len(b'other'),
            sha256=hashlib.sha256(b'other').hexdigest(),
            case=cls.other_case_a,
            client=cls.other_client_a,
            uploaded_by=cls.other_lawyer_a,
        )
        cls.document_b = Document.objects.create(
            title='foreign.txt',
            file=SimpleUploadedFile('foreign.txt', b'foreign'),
            original_filename='foreign.txt',
            mime_type='text/plain',
            size=len(b'foreign'),
            sha256=hashlib.sha256(b'foreign').hexdigest(),
            case=cls.case_b,
            client=cls.client_b,
            uploaded_by=cls.lawyer_b,
        )

        cls.transaction_a = Transaction.objects.create(
            client=cls.client_a,
            case=cls.case_a,
            description='Authorized transaction',
            amount='100.00',
            date=timezone.localdate(),
            type=Transaction.Type.INVOICE,
            status=Transaction.Status.OUTSTANDING,
            created_by=cls.lawyer_a,
        )
        cls.other_transaction_a = Transaction.objects.create(
            client=cls.other_client_a,
            case=cls.other_case_a,
            description='Other transaction',
            amount='200.00',
            date=timezone.localdate(),
            type=Transaction.Type.INVOICE,
            status=Transaction.Status.OUTSTANDING,
            created_by=cls.other_lawyer_a,
        )
        cls.transaction_b = Transaction.objects.create(
            client=cls.client_b,
            case=cls.case_b,
            description='Foreign transaction',
            amount='300.00',
            date=timezone.localdate(),
            type=Transaction.Type.INVOICE,
            status=Transaction.Status.OUTSTANDING,
            created_by=cls.lawyer_b,
        )

    def auth(self, user):
        self.client.force_authenticate(user=user)

    def ids(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return {item['id'] for item in response.data}

    def test_unauthenticated_requests_are_rejected(self):
        protected_gets = (
            '/api/users/profile/',
            '/api/users/manage/',
            '/api/users/team/',
            '/api/clients/',
            '/api/cases/',
            '/api/tasks/',
            '/api/events/',
            '/api/notes/',
            '/api/documents/',
            '/api/documents/audit/',
            '/api/finance/invoices/',
            '/api/finance/payments/',
            '/api/finance/transactions/',
            '/api/finance/audit/',
            f'/api/clients/{self.client_a.pk}/',
            f'/api/cases/{self.case_a.pk}/',
            f'/api/tasks/{self.task_a.pk}/',
            f'/api/events/{self.event_a.pk}/',
            f'/api/notes/{self.note_a.pk}/',
            f'/api/documents/{self.document_a.pk}/',
            f'/api/documents/{self.document_a.pk}/download/',
            f'/api/users/manage/{self.assistant_a.pk}/',
        )
        for url in protected_gets:
            with self.subTest(url=url):
                self.assertEqual(
                    self.client.get(url).status_code,
                    status.HTTP_401_UNAUTHORIZED,
                )

        protected_posts = (
            ('/api/users/register/', {}),
            ('/api/clients/', {}),
            ('/api/cases/', {}),
            ('/api/tasks/', {}),
            ('/api/events/', {}),
            ('/api/notes/', {}),
            (f'/api/tasks/{self.task_a.pk}/restore/', {}),
        )
        for url, payload in protected_posts:
            with self.subTest(url=url):
                self.assertEqual(
                    self.client.post(url, payload, format='json').status_code,
                    status.HTTP_401_UNAUTHORIZED,
                )

    def test_assistant_role_denials_cover_finance_admin_and_legal_management(self):
        self.auth(self.assistant_a)
        for url in (
            '/api/finance/invoices/',
            '/api/finance/payments/',
            '/api/finance/transactions/',
            '/api/finance/audit/',
            '/api/users/manage/',
        ):
            with self.subTest(url=url):
                self.assertEqual(
                    self.client.get(url).status_code,
                    status.HTTP_403_FORBIDDEN,
                )

        self.assertEqual(
            self.client.post('/api/users/register/', {}, format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post('/api/clients/', {}, format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post('/api/cases/', {}, format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_cross_lawyer_idor_is_hidden_for_all_legal_objects_and_actions(self):
        self.auth(self.lawyer_a)
        other_objects = (
            ('clients', self.other_client_a.pk),
            ('cases', self.other_case_a.pk),
            ('tasks', self.other_task_a.pk),
            ('events', self.other_event_a.pk),
            ('notes', self.other_note_a.pk),
            ('documents', self.other_document_a.pk),
        )
        for resource, object_id in other_objects:
            url = f'/api/{resource}/{object_id}/'
            with self.subTest(method='get', resource=resource):
                self.assertEqual(
                    self.client.get(url).status_code,
                    status.HTTP_404_NOT_FOUND,
                )
            with self.subTest(method='patch', resource=resource):
                self.assertEqual(
                    self.client.patch(url, {'title': 'IDOR'}, format='json').status_code,
                    status.HTTP_404_NOT_FOUND,
                )
            with self.subTest(method='delete', resource=resource):
                self.assertEqual(
                    self.client.delete(url).status_code,
                    status.HTTP_404_NOT_FOUND,
                )

        self.assertEqual(
            self.client.post(
                f'/api/tasks/{self.other_task_a.pk}/restore/', {}, format='json'
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.get(
                f'/api/documents/{self.other_document_a.pk}/download/'
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertTrue(Client.objects.filter(pk=self.other_client_a.pk).exists())
        self.assertTrue(Case.objects.filter(pk=self.other_case_a.pk).exists())
        self.assertTrue(Document.objects.filter(pk=self.other_document_a.pk).exists())

    def test_cross_cabinet_idor_is_hidden_even_from_an_admin(self):
        self.auth(self.admin_a)
        foreign_urls = (
            f'/api/clients/{self.client_b.pk}/',
            f'/api/cases/{self.case_b.pk}/',
            f'/api/tasks/{self.task_b.pk}/',
            f'/api/events/{self.event_b.pk}/',
            f'/api/notes/{self.note_b.pk}/',
            f'/api/documents/{self.document_b.pk}/',
            f'/api/documents/{self.document_b.pk}/download/',
            f'/api/finance/transactions/{self.transaction_b.pk}/',
            f'/api/users/manage/{self.lawyer_b.pk}/',
        )
        for url in foreign_urls:
            with self.subTest(url=url):
                self.assertEqual(
                    self.client.get(url).status_code,
                    status.HTTP_404_NOT_FOUND,
                )

        self.assertEqual(
            self.client.patch(
                f'/api/users/manage/{self.lawyer_b.pk}/',
                {'is_active': False},
                format='json',
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.post(
                f'/api/users/manage/{self.lawyer_b.pk}/reset-password/',
                {'password': self.PASSWORD},
                format='json',
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.lawyer_b.refresh_from_db()
        self.assertTrue(self.lawyer_b.is_active)

    def test_admin_is_limited_to_own_cabinet(self):
        self.auth(self.admin_a)
        self.assertEqual(
            self.ids('/api/clients/'), {self.client_a.pk, self.other_client_a.pk}
        )
        self.assertEqual(
            self.ids('/api/cases/'), {self.case_a.pk, self.other_case_a.pk}
        )
        self.assertNotIn(self.transaction_b.pk, self.ids('/api/finance/transactions/'))
        self.assertEqual(
            self.client.get(f'/api/cases/{self.case_b.pk}/').status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_lawyer_cannot_see_unassigned_same_cabinet_or_foreign_objects(self):
        self.auth(self.lawyer_a)
        self.assertEqual(self.ids('/api/clients/'), {self.client_a.pk})
        self.assertEqual(self.ids('/api/cases/'), {self.case_a.pk})
        self.assertEqual(self.ids('/api/tasks/'), {self.task_a.pk})
        self.assertEqual(self.ids('/api/events/'), {self.event_a.pk})
        self.assertEqual(self.ids('/api/notes/'), {self.note_a.pk})
        self.assertEqual(self.ids('/api/documents/'), {self.document_a.pk})
        self.assertEqual(
            self.client.get(f'/api/clients/{self.other_client_a.pk}/').status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_assistant_only_sees_assignments_and_their_context(self):
        self.auth(self.assistant_a)
        self.assertEqual(self.ids('/api/clients/'), {self.client_a.pk})
        self.assertEqual(self.ids('/api/cases/'), {self.case_a.pk})
        self.assertEqual(self.ids('/api/tasks/'), {self.task_a.pk})
        self.assertEqual(self.ids('/api/events/'), {self.event_a.pk})
        self.assertEqual(self.ids('/api/notes/'), {self.note_a.pk})
        self.assertEqual(self.ids('/api/documents/'), {self.document_a.pk})
        for url in (
            f'/api/cases/{self.other_case_a.pk}/',
            f'/api/tasks/{self.other_task_a.pk}/',
            f'/api/events/{self.other_event_a.pk}/',
            f'/api/notes/{self.other_note_a.pk}/',
            f'/api/documents/{self.other_document_a.pk}/',
        ):
            self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    def test_assistant_cannot_mutate_clients_or_cases(self):
        self.auth(self.assistant_a)
        self.assertEqual(
            self.client.patch(
                f'/api/clients/{self.client_a.pk}/', {'phone': 'forbidden'}, format='json'
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(
                '/api/cases/', {'title': 'Forbidden', 'client': self.client_a.pk}, format='json'
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_object_permission_allows_assistant_own_note_not_lawyer_note(self):
        self.auth(self.assistant_a)
        forbidden = self.client.patch(
            f'/api/notes/{self.note_a.pk}/', {'content': 'tampered'}, format='json'
        )
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

        created = self.client.post(
            '/api/notes/',
            {'title': 'Assistant note', 'content': 'owned', 'case': self.case_a.pk},
            format='json',
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        self.assertEqual(
            self.client.patch(
                f"/api/notes/{created.data['id']}/", {'content': 'updated'}, format='json'
            ).status_code,
            status.HTTP_200_OK,
        )
        denied_create = self.client.post(
            '/api/notes/',
            {'content': 'outside scope', 'case': self.other_case_a.pk},
            format='json',
        )
        self.assertEqual(denied_create.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cross_cabinet_and_assignment_payloads_are_rejected(self):
        self.auth(self.lawyer_a)
        cross_case = self.client.post(
            '/api/cases/',
            {'title': 'Cross cabinet', 'client': self.client_b.pk},
            format='json',
        )
        self.assertEqual(cross_case.status_code, status.HTTP_400_BAD_REQUEST)

        cross_assignee = self.client.post(
            '/api/tasks/',
            {'title': 'Cross assignment', 'case': self.case_a.pk, 'assigned_to': self.lawyer_b.pk},
            format='json',
        )
        self.assertEqual(cross_assignee.status_code, status.HTTP_400_BAD_REQUEST)

        cross_attendee = self.client.post(
            '/api/events/',
            {
                'title': 'Cross cabinet hearing',
                'start_time': timezone.now().isoformat(),
                'end_time': (timezone.now() + timedelta(hours=1)).isoformat(),
                'case': self.case_a.pk,
                'attendees': [self.lawyer_b.pk],
            },
            format='json',
        )
        self.assertEqual(cross_attendee.status_code, status.HTTP_400_BAD_REQUEST)

        promote_access = self.client.patch(
            f'/api/cases/{self.case_a.pk}/',
            {'assigned_lawyers': [self.other_lawyer_a.pk]},
            format='json',
        )
        self.assertEqual(promote_access.status_code, status.HTTP_400_BAD_REQUEST)

    def test_case_client_business_relation_is_validated_for_notes_and_documents(self):
        second_client = Client.objects.create(
            cabinet=self.cabinet_a,
            created_by=self.lawyer_a,
            first_name='Second authorized',
            last_name='Client',
        )
        self.auth(self.lawyer_a)

        note = self.client.post(
            '/api/notes/',
            {
                'title': 'Inconsistent note',
                'content': 'Must be rejected',
                'case': self.case_a.pk,
                'client': second_client.pk,
            },
            format='json',
        )
        document = self.client.post(
            '/api/documents/',
            {
                'title': 'inconsistent.txt',
                'file': SimpleUploadedFile(
                    'inconsistent.txt', b'inconsistent', content_type='text/plain'
                ),
                'case': self.case_a.pk,
                'client': second_client.pk,
            },
            format='multipart',
        )

        self.assertEqual(note.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(document.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('client', note.data)
        self.assertIn('client', document.data)
        self.assertFalse(Note.objects.filter(title='Inconsistent note').exists())
        self.assertFalse(Document.objects.filter(title='inconsistent.txt').exists())

    def test_documents_use_authenticated_downloads_only(self):
        self.auth(self.assistant_a)
        detail = self.client.get(f'/api/documents/{self.document_a.pk}/')
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertNotIn('file', detail.data)
        self.assertIn('download_url', detail.data)
        self.assertEqual(
            self.client.get(f'/api/documents/{self.document_a.pk}/download/').status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.get(f'/api/documents/{self.other_document_a.pk}/download/').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        with self.assertRaises(ValueError):
            _ = self.document_a.file.url
        self.assertEqual(
            self.client.get(f'/media/{self.document_a.file.name}').status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_finance_is_role_and_object_scoped(self):
        self.auth(self.lawyer_a)
        self.assertEqual(
            self.ids('/api/finance/transactions/'), {self.transaction_a.pk}
        )
        self.assertEqual(
            self.client.get(
                f'/api/finance/transactions/{self.other_transaction_a.pk}/'
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.auth(self.assistant_a)
        self.assertEqual(
            self.client.get('/api/finance/transactions/').status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_user_management_is_cabinet_scoped(self):
        self.auth(self.admin_a)
        listed = self.ids('/api/users/manage/')
        self.assertIn(self.assistant_a.pk, listed)
        self.assertNotIn(self.lawyer_b.pk, listed)
        self.assertEqual(
            self.client.get(f'/api/users/manage/{self.lawyer_b.pk}/').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        created = self.client.post(
            '/api/users/manage/',
            {
                'username': 'new_assistant_a',
                'password': self.PASSWORD,
                'role': CustomUser.Role.ASSISTANT,
            },
            format='json',
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        self.assertEqual(
            CustomUser.objects.get(pk=created.data['id']).cabinet_id,
            self.cabinet_a.pk,
        )

    def test_team_directory_is_read_only_and_cabinet_scoped(self):
        self.auth(self.assistant_a)
        listed = self.ids('/api/users/team/')
        self.assertIn(self.lawyer_a.pk, listed)
        self.assertIn(self.assistant_a.pk, listed)
        self.assertNotIn(self.lawyer_b.pk, listed)
        response = self.client.get('/api/users/team/')
        self.assertNotIn('email', response.data[0])
        self.assertEqual(
            self.client.post('/api/users/team/', {}, format='json').status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
