from django.contrib import admin
from .models import Invoice, Payment, Transaction

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'case', 'amount', 'status', 'issue_date', 'due_date')
    list_filter = ('status', 'issue_date', 'due_date')
    search_fields = ('client__first_name', 'client__last_name', 'case__title')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice', 'amount', 'date', 'method')
    list_filter = ('method', 'date')
    search_fields = ('invoice__client__first_name', 'invoice__client__last_name')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('description', 'client', 'case', 'type', 'amount', 'date', 'status')
    list_filter = ('type', 'status', 'date')
    search_fields = ('description', 'client__first_name', 'client__last_name', 'case__title')
