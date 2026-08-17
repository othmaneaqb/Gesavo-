from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView,
    UserProfileView,
    ManagedUserViewSet,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    LogoutView,
    TeamMemberListView,
)
from .serializers import PasswordAwareTokenRefreshSerializer

router = DefaultRouter()
router.register(r'manage', ManagedUserViewSet, basename='managed-user')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path(
        'login/refresh/',
        TokenRefreshView.as_view(serializer_class=PasswordAwareTokenRefreshSerializer),
        name='token_refresh',
    ),
    path('logout/', LogoutView.as_view(), name='token_logout'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('team/', TeamMemberListView.as_view(), name='team'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('', include(router.urls)),
]
