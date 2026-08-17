from datetime import timedelta

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction as db_transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from cases.models import Case
from clients.models import Client
from finance.models import FinanceAuditLog, Invoice, InvoiceSequence, Transaction
from users.models import Cabinet, CustomUser


class FinanceBusinessValidationTests(APITestCase):
    PASSWORD = 'F9!nance#Validation2026'

    @classmethod
    def setUpTestData(cls):
        cls.cabinet_a = Cabinet.objects.create(name='Finance A', slug='finance-a')
        cls.cabinet_b = Cabinet.objects.create(name='Finance B', slug='finance-b')

        def user(username, role, cabinet):
            return CustomUser.objects.create_user(
                username=username,
                password=cls.PASSWORD,
                role=role,
                cabinet=cabinet,
            )

        cls.admin_a = user('finance_admin_a', CustomUser.Role.ADMIN, cls.cabinet_a)
        cls.lawyer_a = user('finance_lawyer_a', CustomUser.Role.LAWYER, cls.cabinet_a)
        cls.other_lawyer_a = user(
            'finance_other_lawyer_a', CustomUser.Role.LAWYER, cls.cabinet_a
        )
        cls.assistant_a = user(
            'finance_assistant_a', CustomUser.Role.ASSISTANT, cls.cabinet_a
        )
        cls.lawyer_b = user('finance_lawyer_b', CustomUser.Role.LAWYER, cls.cabinet_b)

        cls.client_a = Client.objects.create(
            cabinet=cls.cabinet_a,
            created_by=cls.lawyer_a,
            first_name='Finance',
            last_name='Client A',
        )
        cls.other_client_a = Client.objects.create(
            cabinet=cls.cabinet_a,
            created_by=cls.other_lawyer_a,
            first_name='Other Finance',
            last_name='Client A',
        )
        cls.client_b = Client.objects.create(
            cabinet=cls.cabinet_b,
            created_by=cls.lawyer_b,
            first_name='Finance',
            last_name='Client B',
        )
        cls.case_a = Case.objects.create(
            client=cls.client_a,
            created_by=cls.lawyer_a,
            title='Finance case A',
        )
        cls.case_a.assigned_lawyers.add(cls.lawyer_a, cls.other_lawyer_a)
        cls.other_case_a = Case.objects.create(
            client=cls.other_client_a,
            created_by=cls.other_lawyer_a,
            title='Other finance case A',
        )
        cls.other_case_a.assigned_lawyers.add(cls.other_lawyer_a)
        cls.case_b = Case.objects.create(
            client=cls.client_b,
            created_by=cls.lawyer_b,
            title='Finance case B',
        )
        cls.case_b.assigned_lawyers.add(cls.lawyer_b)

    def auth(self, user):
        self.client.force_authenticate(user=user)

    def transaction_payload(self, **overrides):
        payload = {
            'client': self.client_a.pk,
            'case': self.case_a.pk,
            'description': 'Legal fees',
            'amount': '100.00',
            'date': timezone.localdate().isoformat(),
            'type': Transaction.Type.INVOICE,
            'status': Transaction.Status.OUTSTANDING,
        }
        payload.update(overrides)
        return payload

    def invoice_payload(self, **overrides):
        payload = {
            'client': self.client_a.pk,
            'case': self.case_a.pk,
            'amount': '100.00',
            'description': 'Invoice',
            'due_date': (timezone.localdate() + timedelta(days=30)).isoformat(),
        }
        payload.update(overrides)
        return payload

    def create_invoice(self, amount='100.00'):
        self.auth(self.lawyer_a)
        response = self.client.post(
            '/api/finance/invoices/',
            self.invoice_payload(amount=amount),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        return Invoice.objects.get(pk=response.data['id'])

    def test_assistant_finance_role_restriction_is_preserved(self):
        self.auth(self.assistant_a)
        for endpoint in ('transactions/', 'invoices/', 'payments/', 'audit/'):
            self.assertEqual(
                self.client.get(f'/api/finance/{endpoint}').status_code,
                status.HTTP_403_FORBIDDEN,
            )

    def test_non_positive_amounts_are_rejected_by_every_api(self):
        self.auth(self.lawyer_a)
        for amount in ('0.00', '-1.00'):
            transaction_response = self.client.post(
                '/api/finance/transactions/',
                self.transaction_payload(amount=amount),
                format='json',
            )
            invoice_response = self.client.post(
                '/api/finance/invoices/',
                self.invoice_payload(amount=amount),
                format='json',
            )
            self.assertEqual(transaction_response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(invoice_response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('amount', transaction_response.data)
            self.assertIn('amount', invoice_response.data)

        invoice = self.create_invoice()
        for amount in ('0.00', '-1.00'):
            response = self.client.post(
                '/api/finance/payments/',
                {'invoice': invoice.pk, 'amount': amount},
                format='json',
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('amount', response.data)

    def test_positive_amount_is_enforced_by_postgresql(self):
        with self.assertRaises(IntegrityError):
            with db_transaction.atomic():
                Transaction.objects.create(
                    client=self.client_a,
                    case=self.case_a,
                    created_by=self.lawyer_a,
                    description='Invalid direct write',
                    amount='-10.00',
                    date=timezone.localdate(),
                    type=Transaction.Type.EXPENSE,
                    status=None,
                )

    def test_client_case_consistency_and_cabinet_isolation(self):
        self.auth(self.lawyer_a)
        inconsistent_transaction = self.client.post(
            '/api/finance/transactions/',
            self.transaction_payload(case=self.other_case_a.pk),
            format='json',
        )
        inconsistent_invoice = self.client.post(
            '/api/finance/invoices/',
            self.invoice_payload(case=self.other_case_a.pk),
            format='json',
        )
        foreign_client = self.client.post(
            '/api/finance/transactions/',
            self.transaction_payload(client=self.client_b.pk, case=self.case_b.pk),
            format='json',
        )

        self.assertEqual(inconsistent_transaction.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(inconsistent_invoice.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(foreign_client.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('case', inconsistent_transaction.data)
        self.assertIn('case', inconsistent_invoice.data)

    def test_invoice_numbers_are_unique_atomic_and_shared_with_ledger_invoices(self):
        self.auth(self.lawyer_a)
        first = self.client.post(
            '/api/finance/transactions/', self.transaction_payload(), format='json'
        )
        second = self.client.post(
            '/api/finance/invoices/', self.invoice_payload(), format='json'
        )
        third = self.client.post(
            '/api/finance/transactions/',
            self.transaction_payload(description='Second ledger invoice'),
            format='json',
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED, first.data)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED, second.data)
        self.assertEqual(third.status_code, status.HTTP_201_CREATED, third.data)

        numbers = {
            first.data['invoice_number'],
            second.data['number'],
            third.data['invoice_number'],
        }
        self.assertEqual(len(numbers), 3)
        self.assertEqual(
            sorted(numbers),
            [
                f'FINANCE-A-{timezone.localdate().year}-00001',
                f'FINANCE-A-{timezone.localdate().year}-00002',
                f'FINANCE-A-{timezone.localdate().year}-00003',
            ],
        )
        sequence = InvoiceSequence.objects.get(
            cabinet=self.cabinet_a, year=timezone.localdate().year
        )
        self.assertEqual(sequence.next_value, 4)
        self.assertEqual(Transaction.objects.get(pk=first.data['id']).created_by, self.lawyer_a)
        self.assertEqual(Invoice.objects.get(pk=second.data['id']).created_by, self.lawyer_a)

        self.auth(self.lawyer_b)
        other_cabinet = self.client.post(
            '/api/finance/transactions/',
            self.transaction_payload(
                client=self.client_b.pk,
                case=self.case_b.pk,
                description='Cabinet B invoice',
            ),
            format='json',
        )
        self.assertEqual(other_cabinet.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            other_cabinet.data['invoice_number'],
            f'FINANCE-B-{timezone.localdate().year}-00001',
        )

    def test_lawyer_can_read_shared_finance_but_only_owner_can_modify(self):
        self.auth(self.lawyer_a)
        created = self.client.post(
            '/api/finance/transactions/', self.transaction_payload(), format='json'
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)

        self.auth(self.other_lawyer_a)
        self.assertEqual(
            self.client.get(
                f"/api/finance/transactions/{created.data['id']}/"
            ).status_code,
            status.HTTP_200_OK,
        )
        denied = self.client.patch(
            f"/api/finance/transactions/{created.data['id']}/",
            {'description': 'Unauthorized edit'},
            format='json',
        )
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self.auth(self.admin_a)
        allowed = self.client.patch(
            f"/api/finance/transactions/{created.data['id']}/",
            {'description': 'Administrator correction'},
            format='json',
        )
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)

    def test_transaction_type_and_status_business_rules(self):
        self.auth(self.lawyer_a)
        invalid_payment = self.client.post(
            '/api/finance/transactions/',
            self.transaction_payload(
                type=Transaction.Type.PAYMENT,
                status=Transaction.Status.OUTSTANDING,
            ),
            format='json',
        )
        invalid_expense = self.client.post(
            '/api/finance/transactions/',
            self.transaction_payload(
                type=Transaction.Type.EXPENSE,
                status=Transaction.Status.OUTSTANDING,
            ),
            format='json',
        )
        valid_payment = self.client.post(
            '/api/finance/transactions/',
            self.transaction_payload(type=Transaction.Type.PAYMENT, status=None),
            format='json',
        )
        valid_expense = self.client.post(
            '/api/finance/transactions/',
            self.transaction_payload(type=Transaction.Type.EXPENSE, status=None),
            format='json',
        )
        self.assertEqual(invalid_payment.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_expense.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(valid_payment.status_code, status.HTTP_201_CREATED)
        self.assertEqual(valid_payment.data['status'], Transaction.Status.PAID)
        self.assertEqual(valid_expense.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(valid_expense.data['status'])

        immutable_type = self.client.patch(
            f"/api/finance/transactions/{valid_expense.data['id']}/",
            {'type': Transaction.Type.INVOICE},
            format='json',
        )
        self.assertEqual(immutable_type.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payments_cannot_overpay_and_drive_invoice_status(self):
        invoice = self.create_invoice('100.00')
        first = self.client.post(
            '/api/finance/payments/',
            {'invoice': invoice.pk, 'amount': '40.00'},
            format='json',
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED, first.data)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PENDING)

        overpay = self.client.post(
            '/api/finance/payments/',
            {'invoice': invoice.pk, 'amount': '70.00'},
            format='json',
        )
        self.assertEqual(overpay.status_code, status.HTTP_400_BAD_REQUEST)

        second = self.client.post(
            '/api/finance/payments/',
            {'invoice': invoice.pk, 'amount': '60.00'},
            format='json',
        )
        self.assertEqual(second.status_code, status.HTTP_201_CREATED, second.data)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PAID)

        below_paid = self.client.patch(
            f'/api/finance/invoices/{invoice.pk}/',
            {'amount': '90.00'},
            format='json',
        )
        self.assertEqual(below_paid.status_code, status.HTTP_400_BAD_REQUEST)

        deleted = self.client.delete(f"/api/finance/payments/{second.data['id']}/")
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PENDING)

    def test_audit_log_is_complete_immutable_and_cabinet_scoped(self):
        self.auth(self.lawyer_a)
        created = self.client.post(
            '/api/finance/transactions/', self.transaction_payload(), format='json'
        )
        item_id = created.data['id']
        updated = self.client.patch(
            f'/api/finance/transactions/{item_id}/',
            {'description': 'Audited correction'},
            format='json',
        )
        deleted = self.client.delete(f'/api/finance/transactions/{item_id}/')
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)

        logs = FinanceAuditLog.objects.filter(
            resource_type=FinanceAuditLog.ResourceType.TRANSACTION,
            resource_id=item_id,
        ).order_by('created_at', 'id')
        self.assertEqual(
            list(logs.values_list('action', flat=True)),
            [
                FinanceAuditLog.Action.CREATE,
                FinanceAuditLog.Action.UPDATE,
                FinanceAuditLog.Action.DELETE,
            ],
        )
        self.assertEqual(logs.first().actor, self.lawyer_a)
        self.assertEqual(logs.first().cabinet, self.cabinet_a)
        self.assertEqual(logs.last().before['description'], 'Audited correction')
        self.assertFalse(Transaction.objects.filter(pk=item_id).exists())

        log = logs.first()
        log.action = FinanceAuditLog.Action.DELETE
        with self.assertRaises(DjangoValidationError):
            log.save()
        with self.assertRaises(DjangoValidationError):
            log.delete()

        audit_response = self.client.get('/api/finance/audit/')
        self.assertEqual(audit_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {item['id'] for item in audit_response.data},
            set(logs.values_list('id', flat=True)),
        )

        self.auth(self.lawyer_b)
        foreign_audit = self.client.get('/api/finance/audit/')
        self.assertEqual(foreign_audit.status_code, status.HTTP_200_OK)
        self.assertEqual(foreign_audit.data, [])

# Create your tests here.
