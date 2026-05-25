from rest_framework import viewsets
from .models import Invoice, Payment, Transaction
from .serializers import InvoiceSerializer, PaymentSerializer, TransactionSerializer
from .permissions import IsLawyer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsLawyer]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsLawyer]


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsLawyer]
