from datetime import date, datetime
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import FinanceAuditLog, Invoice, InvoiceSequence, Payment, Transaction


def generate_invoice_number(cabinet, *, year=None):
    """Return a unique cabinet/year sequence number inside an atomic block."""
    year = year or timezone.localdate().year
    sequence, _ = InvoiceSequence.objects.select_for_update().get_or_create(
        cabinet=cabinet,
        year=year,
        defaults={'next_value': 1},
    )
    value = sequence.next_value
    sequence.next_value = value + 1
    sequence.save(update_fields=['next_value'])
    return f'{cabinet.slug.upper()}-{year}-{value:05d}'


def _json_value(value):
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def finance_snapshot(instance):
    snapshot = {
        field.name: _json_value(field.value_from_object(instance))
        for field in instance._meta.concrete_fields
    }
    if isinstance(instance, Invoice) and instance.pk:
        snapshot['payment_total'] = str(
            instance.payments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        )
    return snapshot


def finance_context(instance):
    if isinstance(instance, Payment):
        return instance.invoice.client, instance.invoice.case
    return instance.client, instance.case


def audit_finance_change(instance, action, actor, *, before=None, after=None):
    resource_types = {
        Invoice: FinanceAuditLog.ResourceType.INVOICE,
        Payment: FinanceAuditLog.ResourceType.PAYMENT,
        Transaction: FinanceAuditLog.ResourceType.TRANSACTION,
    }
    client, case = finance_context(instance)
    return FinanceAuditLog.objects.create(
        cabinet=client.cabinet,
        actor=actor,
        client=client,
        case=case,
        resource_type=resource_types[type(instance)],
        resource_id=instance.pk,
        action=action,
        before=before if before is not None else {},
        after=after if after is not None else {},
    )


def payment_total(invoice, *, exclude_payment_id=None):
    queryset = invoice.payments.all()
    if exclude_payment_id:
        queryset = queryset.exclude(pk=exclude_payment_id)
    return queryset.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')


def validate_payment_capacity(invoice, amount, *, exclude_payment_id=None):
    if payment_total(invoice, exclude_payment_id=exclude_payment_id) + amount > invoice.amount:
        raise ValidationError(
            {'amount': 'Total payments cannot exceed the invoice amount.'}
        )


def validate_invoice_amount(invoice, amount):
    if payment_total(invoice) > amount:
        raise ValidationError(
            {'amount': 'Invoice amount cannot be lower than payments already recorded.'}
        )


def sync_invoice_status(invoice, actor, *, before=None):
    before = before or finance_snapshot(invoice)
    total = payment_total(invoice)
    if total == 0:
        status = Invoice.Status.UNPAID
    elif total >= invoice.amount:
        status = Invoice.Status.PAID
    else:
        status = Invoice.Status.PENDING

    if invoice.status == status:
        return invoice

    invoice.status = status
    invoice.updated_at = timezone.now()
    invoice.save(update_fields=['status', 'updated_at'])
    audit_finance_change(
        invoice,
        FinanceAuditLog.Action.UPDATE,
        actor,
        before=before,
        after=finance_snapshot(invoice),
    )
    return invoice
