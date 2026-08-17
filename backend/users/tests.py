import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from cases.models import Case
from clients.models import Client
from documents.models import Document
from events.models import Event
from finance.models import FinanceAuditLog, Transaction
from notes.models import Note
from tasks.models import Task
from users.models import Cabinet, CustomUser


class BaselineCharacterizationTests(APITestCase):
    """Safety net for behavior that existed before the architecture changes."""

    LAWYER_PASSWORD = "BaselineLawyer123!"
    ASSISTANT_PASSWORD = "BaselineAssistant123!"

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
        cls._media_override.disable()
        cls._media_directory.cleanup()
        super().tearDownClass()

    @classmethod
    def setUpTestData(cls):
        cls.cabinet = Cabinet.objects.create(
            name='Baseline Cabinet', slug='baseline-cabinet'
        )
        cls.lawyer = CustomUser.objects.create_user(
            username="baseline_lawyer",
            email="baseline.lawyer@example.test",
            password=cls.LAWYER_PASSWORD,
            role=CustomUser.Role.LAWYER,
            cabinet=cls.cabinet,
        )
        cls.assistant = CustomUser.objects.create_user(
            username="baseline_assistant",
            email="baseline.assistant@example.test",
            password=cls.ASSISTANT_PASSWORD,
            role=CustomUser.Role.ASSISTANT,
            cabinet=cls.cabinet,
        )

    def authenticate(self, user, password):
        response = self.client.post(
            "/api/users/login/",
            {"username": user.username, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return response

    def create_case_fixture(self):
        client = Client.objects.create(
            first_name="Baseline",
            last_name="Client",
            email="baseline.fixture@example.test",
            cabinet=self.cabinet,
            created_by=self.lawyer,
        )
        case = Case.objects.create(
            title="Baseline Case",
            case_number="BASELINE-001",
            client=client,
            created_by=self.lawyer,
        )
        case.assigned_lawyers.add(self.lawyer)
        return client, case

    def test_lawyer_login(self):
        response = self.authenticate(self.lawyer, self.LAWYER_PASSWORD)
        self.assertTrue(response.data["access"])

        profile_response = self.client.get("/api/users/profile/")
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data["id"], self.lawyer.id)
        self.assertEqual(profile_response.data["role"], CustomUser.Role.LAWYER)

    def test_assistant_login(self):
        response = self.authenticate(self.assistant, self.ASSISTANT_PASSWORD)
        self.assertTrue(response.data["access"])

        profile_response = self.client.get("/api/users/profile/")
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data["id"], self.assistant.id)
        self.assertEqual(profile_response.data["role"], CustomUser.Role.ASSISTANT)

    def test_clients_crud(self):
        self.authenticate(self.lawyer, self.LAWYER_PASSWORD)

        create_response = self.client.post(
            "/api/clients/",
            {
                "first_name": "Characterization",
                "last_name": "Client",
                "email": "characterization.client@example.test",
                "phone": "+212600000000",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        client_id = create_response.data["id"]

        read_response = self.client.get(f"/api/clients/{client_id}/")
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertEqual(read_response.data["first_name"], "Characterization")

        update_response = self.client.patch(
            f"/api/clients/{client_id}/",
            {"phone": "+212611111111"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["phone"], "+212611111111")

        delete_response = self.client.delete(f"/api/clients/{client_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Client.objects.filter(pk=client_id).exists())

    def test_cases_crud(self):
        self.authenticate(self.lawyer, self.LAWYER_PASSWORD)
        client = Client.objects.create(
            first_name="Case",
            last_name="Client",
            email="case.client@example.test",
            cabinet=self.cabinet,
            created_by=self.lawyer,
        )

        create_response = self.client.post(
            "/api/cases/",
            {
                "title": "Characterization Case",
                "case_number": "CHAR-CASE-001",
                "status": Case.Status.OPEN,
                "client": client.id,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        case_id = create_response.data["id"]

        read_response = self.client.get(f"/api/cases/{case_id}/")
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertEqual(read_response.data["client"]["id"], client.id)

        update_response = self.client.patch(
            f"/api/cases/{case_id}/",
            {"status": Case.Status.PENDING},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["status"], Case.Status.PENDING)

        delete_response = self.client.delete(f"/api/cases/{case_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Case.objects.filter(pk=case_id).exists())

    def test_task_completion_and_restoration(self):
        self.authenticate(self.lawyer, self.LAWYER_PASSWORD)
        _, case = self.create_case_fixture()

        create_response = self.client.post(
            "/api/tasks/",
            {
                "title": "Complete the characterization task",
                "status": Task.Status.PENDING,
                "case": case.id,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        task_id = create_response.data["id"]

        complete_response = self.client.patch(
            f"/api/tasks/{task_id}/",
            {"status": Task.Status.COMPLETED},
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["status"], Task.Status.COMPLETED)
        self.assertIsNotNone(complete_response.data["completed_at"])

        restore_response = self.client.post(f"/api/tasks/{task_id}/restore/", {}, format="json")
        self.assertEqual(restore_response.status_code, status.HTTP_200_OK)
        self.assertEqual(restore_response.data["status"], Task.Status.IN_PROGRESS)
        self.assertFalse(restore_response.data["is_archived"])
        self.assertIsNone(restore_response.data["completed_at"])
        self.assertIsNone(restore_response.data["archived_at"])

        delete_response = self.client.delete(f"/api/tasks/{task_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(pk=task_id).exists())

    def test_hearing_creation(self):
        self.authenticate(self.lawyer, self.LAWYER_PASSWORD)
        _, case = self.create_case_fixture()

        create_response = self.client.post(
            "/api/events/",
            {
                "title": "Characterization Hearing",
                "court": "Baseline Court",
                "status": "UPCOMING",
                "start_time": "2026-08-20T09:00:00Z",
                "end_time": "2026-08-20T10:00:00Z",
                "case": case.id,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["title"], "Characterization Hearing")
        self.assertEqual(create_response.data["case"], case.id)
        event_id = create_response.data["id"]

        read_response = self.client.get(f"/api/events/{event_id}/")
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertEqual(read_response.data["court"], "Baseline Court")

        update_response = self.client.patch(
            f"/api/events/{event_id}/",
            {"court": "Updated Baseline Court"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["court"], "Updated Baseline Court")

        delete_response = self.client.delete(f"/api/events/{event_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Event.objects.filter(pk=event_id).exists())

    def test_document_upload(self):
        self.authenticate(self.lawyer, self.LAWYER_PASSWORD)
        client, case = self.create_case_fixture()
        upload = SimpleUploadedFile(
            "characterization.txt",
            b"GesAvo characterization document",
            content_type="text/plain",
        )

        response = self.client.post(
            "/api/documents/",
            {
                "title": "characterization.txt",
                "description": "Baseline upload",
                "file": upload,
                "client": client.id,
                "case": case.id,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        document = Document.objects.get(pk=response.data["id"])
        self.assertEqual(document.uploaded_by, self.lawyer)
        with document.file.open('rb') as handle:
            self.assertEqual(handle.read(), b"GesAvo characterization document")
        document_id = document.pk
        stored_name = document.file.name
        storage = document.file.storage

        read_response = self.client.get(f"/api/documents/{document_id}/")
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)

        update_response = self.client.patch(
            f"/api/documents/{document_id}/",
            {"description": "Updated baseline upload"},
            format="multipart",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["description"], "Updated baseline upload")

        download_response = self.client.get(
            f"/api/documents/{document_id}/download/"
        )
        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            b''.join(download_response.streaming_content),
            b"GesAvo characterization document",
        )

        with self.captureOnCommitCallbacks(execute=True):
            delete_response = self.client.delete(f"/api/documents/{document_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Document.objects.filter(pk=document_id).exists())
        self.assertFalse(storage.exists(stored_name))

    def test_notes(self):
        self.authenticate(self.lawyer, self.LAWYER_PASSWORD)
        client, case = self.create_case_fixture()

        create_response = self.client.post(
            "/api/notes/",
            {
                "title": "Characterization Note",
                "content": "Initial baseline note",
                "client": client.id,
                "case": case.id,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        note_id = create_response.data["id"]
        self.assertEqual(Note.objects.get(pk=note_id).author, self.lawyer)

        update_response = self.client.patch(
            f"/api/notes/{note_id}/",
            {"content": "Updated baseline note"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["content"], "Updated baseline note")

        read_response = self.client.get(f"/api/notes/{note_id}/")
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertEqual(read_response.data["content"], "Updated baseline note")

        delete_response = self.client.delete(f"/api/notes/{note_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(pk=note_id).exists())

    def test_lawyer_finance_access(self):
        self.authenticate(self.lawyer, self.LAWYER_PASSWORD)

        response = self.client.get("/api/finance/transactions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_finance_transaction_crud(self):
        self.authenticate(self.lawyer, self.LAWYER_PASSWORD)
        client, case = self.create_case_fixture()

        create_response = self.client.post(
            "/api/finance/transactions/",
            {
                "client": client.pk,
                "case": case.pk,
                "description": "Baseline legal fees",
                "amount": "125.50",
                "date": timezone.localdate().isoformat(),
                "type": Transaction.Type.INVOICE,
                "status": Transaction.Status.OUTSTANDING,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        transaction_id = create_response.data["id"]
        self.assertTrue(create_response.data["invoice_number"])

        read_response = self.client.get(
            f"/api/finance/transactions/{transaction_id}/"
        )
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertEqual(read_response.data["amount"], "125.50")

        update_response = self.client.patch(
            f"/api/finance/transactions/{transaction_id}/",
            {"description": "Updated baseline legal fees"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            update_response.data["description"], "Updated baseline legal fees"
        )

        delete_response = self.client.delete(
            f"/api/finance/transactions/{transaction_id}/"
        )
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Transaction.objects.filter(pk=transaction_id).exists())
        self.assertEqual(
            FinanceAuditLog.objects.filter(resource_id=transaction_id).count(), 3
        )

    def test_assistant_finance_is_forbidden(self):
        self.authenticate(self.assistant, self.ASSISTANT_PASSWORD)

        response = self.client.get("/api/finance/transactions/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
