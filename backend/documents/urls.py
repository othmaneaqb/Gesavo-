from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentAuditLogViewSet, DocumentViewSet

router = DefaultRouter()
router.register(r'', DocumentViewSet)

urlpatterns = [
    path(
        'audit/',
        DocumentAuditLogViewSet.as_view({'get': 'list'}),
        name='document-audit-list',
    ),
    path(
        'audit/<int:pk>/',
        DocumentAuditLogViewSet.as_view({'get': 'retrieve'}),
        name='document-audit-detail',
    ),
    path('', include(router.urls)),
]
