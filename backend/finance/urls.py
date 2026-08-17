from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FinanceAuditLogViewSet,
    InvoiceViewSet,
    PaymentViewSet,
    TransactionViewSet,
)

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'audit', FinanceAuditLogViewSet, basename='finance-audit')

urlpatterns = [
    path('', include(router.urls)),
]
