from django.db import transaction
from rest_framework import viewsets

from .models import FinanceAuditLog, Invoice, Payment, Transaction
from .serializers import (
    FinanceAuditLogSerializer,
    InvoiceSerializer,
    PaymentSerializer,
    TransactionSerializer,
)
from .services import (
    audit_finance_change,
    finance_snapshot,
    generate_invoice_number,
    sync_invoice_status,
    validate_invoice_amount,
    validate_payment_capacity,
)
from core.access import (
    ADMIN,
    LAWYER,
    accessible_invoices,
    accessible_payments,
    accessible_transactions,
    accessible_finance_audit,
    is_admin,
)
from core.permissions import CabinetObjectPermission


class FinanceScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [CabinetObjectPermission]
    allowed_roles = {'*': (ADMIN, LAWYER)}

    def can_modify_object(self, user, obj):
        return is_admin(user) or obj.created_by_id == user.pk

class InvoiceViewSet(FinanceScopedViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        return accessible_invoices(self.request.user).prefetch_related('payments')

    @transaction.atomic
    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        invoice = serializer.save(
            number=generate_invoice_number(client.cabinet),
            created_by=self.request.user,
            status=Invoice.Status.UNPAID,
        )
        audit_finance_change(
            invoice,
            FinanceAuditLog.Action.CREATE,
            self.request.user,
            after=finance_snapshot(invoice),
        )

    @transaction.atomic
    def perform_update(self, serializer):
        invoice = Invoice.objects.select_for_update().get(pk=serializer.instance.pk)
        serializer.instance = invoice
        amount = serializer.validated_data.get('amount', invoice.amount)
        validate_invoice_amount(invoice, amount)
        before = finance_snapshot(invoice)
        invoice = serializer.save()
        audit_finance_change(
            invoice,
            FinanceAuditLog.Action.UPDATE,
            self.request.user,
            before=before,
            after=finance_snapshot(invoice),
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        invoice = Invoice.objects.select_for_update().get(pk=instance.pk)
        for payment in invoice.payments.select_related('invoice__client', 'invoice__case'):
            audit_finance_change(
                payment,
                FinanceAuditLog.Action.DELETE,
                self.request.user,
                before=finance_snapshot(payment),
            )
        audit_finance_change(
            invoice,
            FinanceAuditLog.Action.DELETE,
            self.request.user,
            before=finance_snapshot(invoice),
        )
        invoice.delete()

class PaymentViewSet(FinanceScopedViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return accessible_payments(self.request.user)

    @transaction.atomic
    def perform_create(self, serializer):
        requested_invoice = serializer.validated_data['invoice']
        invoice = Invoice.objects.select_for_update().get(pk=requested_invoice.pk)
        invoice_before = finance_snapshot(invoice)
        amount = serializer.validated_data['amount']
        validate_payment_capacity(invoice, amount)
        payment = serializer.save(invoice=invoice, created_by=self.request.user)
        audit_finance_change(
            payment,
            FinanceAuditLog.Action.CREATE,
            self.request.user,
            after=finance_snapshot(payment),
        )
        sync_invoice_status(invoice, self.request.user, before=invoice_before)

    @transaction.atomic
    def perform_update(self, serializer):
        payment = Payment.objects.select_for_update().select_related(
            'invoice__client'
        ).get(pk=serializer.instance.pk)
        serializer.instance = payment
        target_invoice = serializer.validated_data.get('invoice', payment.invoice)
        invoice_ids = sorted({payment.invoice_id, target_invoice.pk})
        invoices = {
            item.pk: item
            for item in Invoice.objects.select_for_update().filter(pk__in=invoice_ids)
        }
        source_invoice = invoices[payment.invoice_id]
        target_invoice = invoices[target_invoice.pk]
        invoice_snapshots = {
            item.pk: finance_snapshot(item) for item in invoices.values()
        }
        amount = serializer.validated_data.get('amount', payment.amount)
        exclude_id = payment.pk if source_invoice.pk == target_invoice.pk else None
        validate_payment_capacity(
            target_invoice,
            amount,
            exclude_payment_id=exclude_id,
        )
        before = finance_snapshot(payment)
        payment = serializer.save(invoice=target_invoice)
        audit_finance_change(
            payment,
            FinanceAuditLog.Action.UPDATE,
            self.request.user,
            before=before,
            after=finance_snapshot(payment),
        )
        sync_invoice_status(
            source_invoice,
            self.request.user,
            before=invoice_snapshots[source_invoice.pk],
        )
        if target_invoice.pk != source_invoice.pk:
            sync_invoice_status(
                target_invoice,
                self.request.user,
                before=invoice_snapshots[target_invoice.pk],
            )

    @transaction.atomic
    def perform_destroy(self, instance):
        payment = Payment.objects.select_for_update().select_related(
            'invoice__client'
        ).get(pk=instance.pk)
        invoice = Invoice.objects.select_for_update().get(pk=payment.invoice_id)
        invoice_before = finance_snapshot(invoice)
        audit_finance_change(
            payment,
            FinanceAuditLog.Action.DELETE,
            self.request.user,
            before=finance_snapshot(payment),
        )
        payment.delete()
        sync_invoice_status(invoice, self.request.user, before=invoice_before)


class TransactionViewSet(FinanceScopedViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return accessible_transactions(self.request.user)

    @transaction.atomic
    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        transaction_type = serializer.validated_data['type']
        invoice_number = None
        if transaction_type == Transaction.Type.INVOICE:
            invoice_number = generate_invoice_number(client.cabinet)
        item = serializer.save(
            created_by=self.request.user,
            invoice_number=invoice_number,
        )
        audit_finance_change(
            item,
            FinanceAuditLog.Action.CREATE,
            self.request.user,
            after=finance_snapshot(item),
        )

    @transaction.atomic
    def perform_update(self, serializer):
        item = Transaction.objects.select_for_update().get(pk=serializer.instance.pk)
        serializer.instance = item
        before = finance_snapshot(item)
        item = serializer.save()
        audit_finance_change(
            item,
            FinanceAuditLog.Action.UPDATE,
            self.request.user,
            before=before,
            after=finance_snapshot(item),
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        item = Transaction.objects.select_for_update().get(pk=instance.pk)
        audit_finance_change(
            item,
            FinanceAuditLog.Action.DELETE,
            self.request.user,
            before=finance_snapshot(item),
        )
        item.delete()


class FinanceAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FinanceAuditLog.objects.all()
    serializer_class = FinanceAuditLogSerializer
    permission_classes = [CabinetObjectPermission]
    allowed_roles = {'*': (ADMIN, LAWYER)}

    def get_queryset(self):
        return accessible_finance_audit(self.request.user)
