from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from cases.models import Case
from clients.models import Client
from users.models import Cabinet


POSITIVE_AMOUNT = MinValueValidator(
    Decimal('0.01'),
    message='Amount must be greater than zero.',
)


class InvoiceSequence(models.Model):
    cabinet = models.ForeignKey(
        Cabinet,
        on_delete=models.PROTECT,
        related_name='invoice_sequences',
    )
    year = models.PositiveSmallIntegerField()
    next_value = models.PositiveBigIntegerField(default=1)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('cabinet', 'year'),
                name='finance_unique_invoice_sequence',
            )
        ]

    def __str__(self):
        return f'{self.cabinet.slug}/{self.year}: {self.next_value}'

class Invoice(models.Model):
    class Status(models.TextChoices):
        UNPAID = 'UNPAID', 'Unpaid'
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        
    number = models.CharField(max_length=80, unique=True, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='invoices')
    case = models.ForeignKey(Case, on_delete=models.SET_NULL, related_name='invoices', blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='created_invoices',
        blank=True,
        null=True,
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[POSITIVE_AMOUNT],
    )
    description = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNPAID)
    
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.number} - {self.client}"

    def clean(self):
        super().clean()
        if self.case_id and self.client_id and self.case.client_id != self.client_id:
            raise ValidationError({'case': 'Case must belong to the selected client.'})

    class Meta:
        ordering = ['-issue_date']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name='finance_invoice_amount_positive',
            )
        ]


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = 'CASH', 'Cash'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        CREDIT_CARD = 'CREDIT_CARD', 'Credit Card'
        CHECK = 'CHECK', 'Check'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[POSITIVE_AMOUNT],
    )
    description = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(auto_now_add=True)
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.BANK_TRANSFER)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='created_payments',
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment of {self.amount} for Invoice #{self.invoice.id}"

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name='finance_payment_amount_positive',
            )
        ]


class Transaction(models.Model):
    class Type(models.TextChoices):
        INVOICE = 'invoice', 'Invoice'
        PAYMENT = 'payment', 'Payment'
        EXPENSE = 'expense', 'Expense'

    class Status(models.TextChoices):
        OUTSTANDING = 'outstanding', 'Outstanding'
        PAID = 'paid', 'Paid'

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='transactions')
    case = models.ForeignKey(Case, on_delete=models.SET_NULL, related_name='transactions', blank=True, null=True)
    invoice_number = models.CharField(
        max_length=80,
        unique=True,
        editable=False,
        blank=True,
        null=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='created_finance_transactions',
        blank=True,
        null=True,
    )
    description = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[POSITIVE_AMOUNT],
    )
    date = models.DateField()
    type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        errors = {}
        if self.case_id and self.client_id and self.case.client_id != self.client_id:
            errors['case'] = 'Case must belong to the selected client.'
        if self.type == self.Type.INVOICE and self.status not in self.Status.values:
            errors['status'] = 'Invoice transactions require a status.'
        elif self.type == self.Type.PAYMENT and self.status != self.Status.PAID:
            errors['status'] = 'Payment transactions must be marked paid.'
        elif self.type == self.Type.EXPENSE and self.status is not None:
            errors['status'] = 'Expense transactions must not have a payment status.'
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.get_type_display()} - {self.amount}"

    class Meta:
        ordering = ['-date', '-id']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name='finance_transaction_amount_positive',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(type='invoice', status__in=('outstanding', 'paid'))
                    | models.Q(type='payment', status='paid')
                    | models.Q(type='expense', status__isnull=True)
                ),
                name='finance_transaction_status_matches_type',
            ),
        ]


class FinanceAuditLog(models.Model):
    class ResourceType(models.TextChoices):
        INVOICE = 'INVOICE', 'Invoice'
        PAYMENT = 'PAYMENT', 'Payment'
        TRANSACTION = 'TRANSACTION', 'Transaction'

    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'

    cabinet = models.ForeignKey(
        Cabinet,
        on_delete=models.PROTECT,
        related_name='finance_audit_logs',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='finance_audit_actions',
        blank=True,
        null=True,
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        related_name='finance_audit_logs',
        blank=True,
        null=True,
    )
    case = models.ForeignKey(
        Case,
        on_delete=models.SET_NULL,
        related_name='finance_audit_logs',
        blank=True,
        null=True,
    )
    resource_type = models.CharField(max_length=20, choices=ResourceType.choices)
    resource_id = models.PositiveBigIntegerField()
    action = models.CharField(max_length=10, choices=Action.choices)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at', '-id')
        indexes = [
            models.Index(
                fields=('cabinet', 'resource_type', 'resource_id'),
                name='finance_audit_resource_idx',
            ),
            models.Index(
                fields=('cabinet', 'created_at'),
                name='finance_audit_created_idx',
            ),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError('Finance audit records are immutable.')
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError('Finance audit records are immutable.')

    def __str__(self):
        return f'{self.action} {self.resource_type} #{self.resource_id}'
