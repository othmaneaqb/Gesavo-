from django.db import models
from cases.models import Case
from clients.models import Client

class Invoice(models.Model):
    class Status(models.TextChoices):
        UNPAID = 'UNPAID', 'Unpaid'
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='invoices')
    case = models.ForeignKey(Case, on_delete=models.SET_NULL, related_name='invoices', blank=True, null=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNPAID)
    
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Invoice #{self.id} - {self.client}"

    class Meta:
        ordering = ['-issue_date']


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = 'CASH', 'Cash'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        CREDIT_CARD = 'CREDIT_CARD', 'Credit Card'
        CHECK = 'CHECK', 'Check'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(auto_now_add=True)
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.BANK_TRANSFER)

    def __str__(self):
        return f"Payment of {self.amount} for Invoice #{self.invoice.id}"


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
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, blank=True, null=True)

    def __str__(self):
        return f"{self.get_type_display()} - {self.amount}"

    class Meta:
        ordering = ['-date', '-id']
