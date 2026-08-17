import hashlib
import tempfile
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from cases.models import Case
from clients.models import Client
from tasks.models import Task
from users.models import Cabinet, CustomUser

from .models import Document, DocumentAuditLog
from .security import sanitize_filename


PDF_CONTENT = b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF'
TEXT_CONTENT = b'Confidential legal document\n'


class DocumentSecurityTests(APITestCase):
    PASSWORD = 'Documents#Secure2026!'

    @classmethod
    def setUpClass(cls):
        cls._private_directory = tempfile.TemporaryDirectory()
        cls._legacy_directory = tempfile.TemporaryDirectory()
        cls._storage_override = override_settings(
            PRIVATE_DOCUMENT_ROOT=cls._private_directory.name,
            MEDIA_ROOT=cls._legacy_directory.name,
        )
        cls._storage_override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._storage_override.disable()
        cls._legacy_directory.cleanup()
        cls._private_directory.cleanup()

    @classmethod
    def setUpTestData(cls):
        cls.cabinet = Cabinet.objects.create(name='Documents A', slug='documents-a')
        cls.other_cabinet = Cabinet.objects.create(
            name='Documents B', slug='documents-b'
        )

        def user(username, role, cabinet):
            return CustomUser.objects.create_user(
                username=username,
                email=f'{username}@example.test',
                password=cls.PASSWORD,
                role=role,
                cabinet=cabinet,
            )

        cls.lawyer = user('document_lawyer', CustomUser.Role.LAWYER, cls.cabinet)
        cls.assistant = user(
            'document_assistant', CustomUser.Role.ASSISTANT, cls.cabinet
        )
        cls.unassigned_assistant = user(
            'unassigned_document_assistant', CustomUser.Role.ASSISTANT, cls.cabinet
        )
        cls.other_lawyer = user(
            'other_document_lawyer', CustomUser.Role.LAWYER, cls.other_cabinet
        )

        cls.client_record = Client.objects.create(
            cabinet=cls.cabinet,
            created_by=cls.lawyer,
            first_name='Private',
            last_name='Client',
        )
        cls.case = Case.objects.create(
            client=cls.client_record,
            created_by=cls.lawyer,
            title='Private case',
        )
        cls.case.assigned_lawyers.add(cls.lawyer)
        Task.objects.create(
            title='Assistant document assignment',
            case=cls.case,
            created_by=cls.lawyer,
            assigned_to=cls.assistant,
        )

        cls.other_client = Client.objects.create(
            cabinet=cls.other_cabinet,
            created_by=cls.other_lawyer,
            first_name='Foreign',
            last_name='Client',
        )
        cls.other_case = Case.objects.create(
            client=cls.other_client,
            created_by=cls.other_lawyer,
            title='Foreign case',
        )
        cls.other_case.assigned_lawyers.add(cls.other_lawyer)

    def auth(self, user):
        self.client.force_authenticate(user=user)

    def upload(self, *, user=None, name='evidence.pdf', content=PDF_CONTENT,
               content_type='application/pdf', case=None, client=None, title=None):
        self.auth(user or self.lawyer)
        response = self.client.post(
            '/api/documents/',
            {
                'title': title or name,
                'description': 'Protected evidence',
                'file': SimpleUploadedFile(name, content, content_type=content_type),
                'case': (case or self.case).pk,
                'client': (client or self.client_record).pk,
            },
            format='multipart',
        )
        return response

    def test_valid_multipart_upload_is_sanitized_and_private(self):
        response = self.upload(name='CON report (final).pdf')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        document = Document.objects.get(pk=response.data['id'])

        self.assertEqual(document.original_filename, 'CON_report_final.pdf')
        self.assertEqual(document.mime_type, 'application/pdf')
        self.assertEqual(document.size, len(PDF_CONTENT))
        self.assertEqual(document.sha256, hashlib.sha256(PDF_CONTENT).hexdigest())
        self.assertNotIn('file', response.data)
        self.assertTrue(response.data['download_url'].endswith(f'/{document.pk}/download/'))
        self.assertTrue(Path(document.file.path).is_relative_to(
            Path(self._private_directory.name)
        ))
        self.assertNotIn('..', document.file.name)
        with self.assertRaises(ValueError):
            _ = document.file.url
        self.assertEqual(
            self.client.get(f'/media/{document.file.name}').status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_filename_sanitizer_removes_paths_controls_and_device_names(self):
        safe = sanitize_filename('../../folder\\bad\r\n name.pdf')
        self.assertEqual(safe, 'bad_name.pdf')
        self.assertEqual(sanitize_filename('CON.pdf'), 'document_CON.pdf')
        self.assertNotIn('/', safe)
        self.assertNotIn('\\', safe)
        self.assertNotIn('\r', safe)
        self.assertNotIn('\n', safe)

    @override_settings(DOCUMENT_MAX_UPLOAD_SIZE=8, DOCUMENT_MAX_UPLOAD_SIZE_MB=0.000008)
    def test_upload_size_limit_is_enforced(self):
        response = self.upload()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('size limit', str(response.data['file'][0]))
        self.assertFalse(Document.objects.exists())

    def test_extension_and_actual_content_must_match(self):
        disallowed = self.upload(name='payload.exe', content_type='application/octet-stream')
        self.assertEqual(disallowed.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('extension', str(disallowed.data['file'][0]).lower())

        disguised = self.upload(name='photo.jpg', content_type='image/jpeg')
        self.assertEqual(disguised.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('content', str(disguised.data['file'][0]).lower())

        wrong_browser_mime = self.upload(
            name='evidence.pdf', content_type='image/png'
        )
        self.assertEqual(wrong_browser_mime.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('browser mime', str(wrong_browser_mime.data['file'][0]).lower())

    def test_empty_upload_is_rejected_without_file_or_audit_side_effects(self):
        files_before = {
            path for path in Path(self._private_directory.name).rglob('*')
            if path.is_file()
        }

        response = self.upload(
            name='empty.txt', content=b'', content_type='text/plain'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)
        self.assertFalse(Document.objects.exists())
        self.assertFalse(DocumentAuditLog.objects.exists())
        files_after = {
            path for path in Path(self._private_directory.name).rglob('*')
            if path.is_file()
        }
        self.assertEqual(files_after, files_before)

    def test_upload_rejects_inconsistent_and_cross_cabinet_relations(self):
        second_client = Client.objects.create(
            cabinet=self.cabinet,
            created_by=self.lawyer,
            first_name='Second',
            last_name='Client',
        )
        files_before = {
            path for path in Path(self._private_directory.name).rglob('*')
            if path.is_file()
        }

        mismatch = self.upload(client=second_client)
        self.assertEqual(mismatch.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('client', mismatch.data)

        foreign = self.upload(case=self.other_case, client=self.other_client)
        self.assertEqual(foreign.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue({'case', 'client'} & set(foreign.data))

        self.assertFalse(Document.objects.exists())
        self.assertFalse(DocumentAuditLog.objects.exists())
        files_after = {
            path for path in Path(self._private_directory.name).rglob('*')
            if path.is_file()
        }
        self.assertEqual(files_after, files_before)

    def test_download_requires_authentication_and_object_access(self):
        created = self.upload()
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        document_id = created.data['id']
        download_url = f'/api/documents/{document_id}/download/'

        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get(download_url).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.auth(self.unassigned_assistant)
        self.assertEqual(
            self.client.get(download_url).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.auth(self.other_lawyer)
        self.assertEqual(
            self.client.get(download_url).status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.auth(self.assistant)
        response = self.client.get(download_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(b''.join(response.streaming_content), PDF_CONTENT)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('attachment;', response['Content-Disposition'])
        self.assertIn('evidence.pdf', response['Content-Disposition'])
        self.assertEqual(response['Cache-Control'], 'private, no-store')
        self.assertEqual(response['Pragma'], 'no-cache')
        self.assertTrue(DocumentAuditLog.objects.filter(
            document_id=document_id,
            actor=self.assistant,
            action=DocumentAuditLog.Action.DOWNLOAD,
        ).exists())

    def test_create_replace_download_and_delete_are_audited(self):
        created = self.upload(
            name='notes.txt', content=TEXT_CONTENT, content_type='text/plain'
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        document = Document.objects.get(pk=created.data['id'])
        original_stored_name = document.file.name
        storage = document.file.storage
        self.assertTrue(storage.exists(original_stored_name))

        with self.captureOnCommitCallbacks(execute=True):
            replaced = self.client.patch(
                f'/api/documents/{document.pk}/',
                {
                    'title': 'Replaced evidence',
                    'file': SimpleUploadedFile(
                        'replacement.pdf', PDF_CONTENT, content_type='application/pdf'
                    ),
                },
                format='multipart',
            )
        self.assertEqual(replaced.status_code, status.HTTP_200_OK, replaced.data)
        document.refresh_from_db()
        replacement_stored_name = document.file.name
        self.assertNotEqual(replacement_stored_name, original_stored_name)
        self.assertFalse(storage.exists(original_stored_name))
        self.assertTrue(storage.exists(replacement_stored_name))

        downloaded = self.client.get(f'/api/documents/{document.pk}/download/')
        self.assertEqual(downloaded.status_code, status.HTTP_200_OK)
        b''.join(downloaded.streaming_content)

        with self.captureOnCommitCallbacks(execute=True):
            deleted = self.client.delete(f'/api/documents/{document.pk}/')
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Document.objects.filter(pk=document.pk).exists())
        self.assertFalse(storage.exists(replacement_stored_name))

        logs = DocumentAuditLog.objects.filter(document_id=document.pk)
        self.assertEqual(
            set(logs.values_list('action', flat=True)),
            {
                DocumentAuditLog.Action.CREATE,
                DocumentAuditLog.Action.UPDATE,
                DocumentAuditLog.Action.DOWNLOAD,
                DocumentAuditLog.Action.DELETE,
            },
        )
        update_log = logs.get(action=DocumentAuditLog.Action.UPDATE)
        self.assertEqual(update_log.before['original_filename'], 'notes.txt')
        self.assertEqual(update_log.after['original_filename'], 'replacement.pdf')
        self.assertNotIn('file', update_log.before)
        delete_log = logs.get(action=DocumentAuditLog.Action.DELETE)
        self.assertEqual(delete_log.original_filename, 'replacement.pdf')
        with self.assertRaises(ValidationError):
            delete_log.delete()
        delete_log.user_agent = 'tampered'
        with self.assertRaises(ValidationError):
            delete_log.save()

    def test_audit_api_is_filtered_by_actor_and_legal_scope(self):
        created = self.upload()
        document_id = created.data['id']
        self.auth(self.assistant)
        downloaded = self.client.get(f'/api/documents/{document_id}/download/')
        b''.join(downloaded.streaming_content)

        assistant_logs = self.client.get('/api/documents/audit/')
        self.assertEqual(assistant_logs.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {item['action'] for item in assistant_logs.data},
            {DocumentAuditLog.Action.DOWNLOAD},
        )
        self.assertTrue(all(item['actor'] == self.assistant.pk for item in assistant_logs.data))

        self.auth(self.lawyer)
        lawyer_logs = self.client.get('/api/documents/audit/')
        self.assertEqual(lawyer_logs.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {item['action'] for item in lawyer_logs.data},
            {DocumentAuditLog.Action.CREATE, DocumentAuditLog.Action.DOWNLOAD},
        )

        self.auth(self.other_lawyer)
        foreign_logs = self.client.get('/api/documents/audit/')
        self.assertEqual(foreign_logs.status_code, status.HTTP_200_OK)
        self.assertEqual(foreign_logs.data, [])
