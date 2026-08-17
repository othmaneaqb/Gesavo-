from django.contrib import admin
from .models import FinanceAuditLog, Invoice, Payment, Transaction

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('number', 'client', 'case', 'amount', 'status', 'created_by', 'issue_date', 'due_date')
    list_filter = ('status', 'issue_date', 'due_date')
    search_fields = ('client__first_name', 'client__last_name', 'case__title')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice', 'amount', 'date', 'method', 'created_by')
    list_filter = ('method', 'date')
    search_fields = ('invoice__client__first_name', 'invoice__client__last_name')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('description', 'invoice_number', 'client', 'case', 'type', 'amount', 'date', 'status', 'created_by')
    list_filter = ('type', 'status', 'date')
    search_fields = ('description', 'client__first_name', 'client__last_name', 'case__title')


@admin.register(FinanceAuditLog)
class FinanceAuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'created_at', 'cabinet', 'actor', 'action', 'resource_type', 'resource_id',
    )
    list_filter = ('cabinet', 'action', 'resource_type', 'created_at')
    search_fields = ('actor__username', 'resource_id')
    readonly_fields = (
        'cabinet', 'actor', 'client', 'case', 'resource_type', 'resource_id',
        'action', 'before', 'after', 'created_at',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
