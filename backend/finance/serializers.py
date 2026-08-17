from decimal import Decimal

from rest_framework import serializers
from .models import FinanceAuditLog, Invoice, Payment, Transaction
from core.access import accessible_cases, accessible_clients, accessible_invoices
from core.validation import (
    ensure_case_access,
    ensure_client_access,
    request_user,
)

class PaymentSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['invoice'].queryset = accessible_invoices(request.user)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('created_by', 'date', 'created_at', 'updated_at')

    def validate_invoice(self, value):
        user = request_user(self)
        if not accessible_invoices(user).filter(pk=value.pk).exists():
            raise serializers.ValidationError('Invoice is outside your authorized scope.')
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        invoice = attrs.get('invoice', getattr(self.instance, 'invoice', None))
        amount = attrs.get('amount', getattr(self.instance, 'amount', None))
        if invoice and amount:
            paid = invoice.payments.all()
            if self.instance:
                paid = paid.exclude(pk=self.instance.pk)
            current_total = sum((item.amount for item in paid), Decimal('0.00'))
            if current_total + amount > invoice.amount:
                raise serializers.ValidationError(
                    {'amount': 'Total payments cannot exceed the invoice amount.'}
                )
        return attrs

class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['client'].queryset = accessible_clients(request.user)
            self.fields['case'].queryset = accessible_cases(request.user)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = (
            'number', 'status', 'created_by', 'issue_date', 'created_at', 'updated_at',
        )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        user = request_user(self)
        client = attrs.get('client', getattr(self.instance, 'client', None))
        case = attrs.get('case', getattr(self.instance, 'case', None))
        ensure_client_access(user, client)
        ensure_case_access(user, case)
        if case and client and case.client_id != client.pk:
            raise serializers.ValidationError(
                {'case': 'Case must belong to the selected client.'}
            )
        amount = attrs.get('amount', getattr(self.instance, 'amount', None))
        if self.instance and amount:
            paid_total = sum(
                (payment.amount for payment in self.instance.payments.all()),
                Decimal('0.00'),
            )
            if paid_total > amount:
                raise serializers.ValidationError(
                    {'amount': 'Invoice amount cannot be lower than payments already recorded.'}
                )
        return attrs


class TransactionSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['client'].queryset = accessible_clients(request.user)
            self.fields['case'].queryset = accessible_cases(request.user)

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = (
            'invoice_number', 'created_by', 'created_at', 'updated_at',
        )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        user = request_user(self)
        client = attrs.get('client', getattr(self.instance, 'client', None))
        case = attrs.get('case', getattr(self.instance, 'case', None))
        ensure_client_access(user, client)
        ensure_case_access(user, case)
        if case and client and case.client_id != client.pk:
            raise serializers.ValidationError(
                {'case': 'Case must belong to the selected client.'}
            )

        transaction_type = attrs.get('type', getattr(self.instance, 'type', None))
        if self.instance and 'type' in attrs and transaction_type != self.instance.type:
            raise serializers.ValidationError(
                {'type': 'Transaction type is immutable after creation.'}
            )

        status = attrs.get('status', getattr(self.instance, 'status', None))
        if transaction_type == Transaction.Type.INVOICE:
            if status is None:
                attrs['status'] = Transaction.Status.OUTSTANDING
            elif status not in Transaction.Status.values:
                raise serializers.ValidationError(
                    {'status': 'Invoice transactions require a valid status.'}
                )
        elif transaction_type == Transaction.Type.PAYMENT:
            if status not in (None, Transaction.Status.PAID):
                raise serializers.ValidationError(
                    {'status': 'Payment transactions must be marked paid.'}
                )
            attrs['status'] = Transaction.Status.PAID
        elif transaction_type == Transaction.Type.EXPENSE:
            if status is not None:
                raise serializers.ValidationError(
                    {'status': 'Expense transactions must not have a payment status.'}
                )
            attrs['status'] = None
        return attrs


class FinanceAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = FinanceAuditLog
        fields = (
            'id', 'cabinet', 'actor', 'actor_name', 'client', 'case',
            'resource_type', 'resource_id', 'action', 'before', 'after',
            'created_at',
        )
        read_only_fields = fields
