from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ManagedUserSerializer,
    PasswordResetSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    LogoutSerializer,
    TeamMemberSerializer,
)
from .models import CustomUser
from .permissions import IsAdministrator
from core.access import accessible_users
from core.permissions import CabinetObjectPermission

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (IsAdministrator,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        if not self.request.user.cabinet_id:
            raise ValidationError({'cabinet': 'Administrator must belong to a cabinet.'})
        serializer.save(cabinet=self.request.user.cabinet)

class UserProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class TeamMemberListView(generics.ListAPIView):
    serializer_class = TeamMemberSerializer
    permission_classes = (CabinetObjectPermission,)

    def get_queryset(self):
        return accessible_users(self.request.user).filter(
            is_active=True,
            is_superuser=False,
        ).order_by('first_name', 'last_name', 'username')


class LogoutView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        users = CustomUser.objects.filter(email__iexact=email, is_active=True)

        for user in users:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_mail(
                subject="Réinitialisation de votre mot de passe - Aït El Hadj Avocat",
                message=(
                    "Bonjour,\n\n"
                    "Une demande de réinitialisation du mot de passe a été effectuée pour votre compte.\n"
                    f"Cliquez sur ce lien pour choisir un nouveau mot de passe :\n{reset_url}\n\n"
                    "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.\n\n"
                    "Cabinet Aït El Hadj"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response(
            {'detail': 'If this email exists, a password reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['password'])
        user.save(update_fields=['password'])
        return Response({'detail': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)


class ManagedUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('username')
    serializer_class = ManagedUserSerializer
    permission_classes = [IsAdministrator]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(
            cabinet_id=self.request.user.cabinet_id,
            is_superuser=False,
        )

    def perform_create(self, serializer):
        if not self.request.user.cabinet_id:
            raise ValidationError({'cabinet': 'Administrator must belong to a cabinet.'})
        serializer.save(cabinet=self.request.user.cabinet)

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError({'detail': 'You cannot delete your own account.'})
        instance.delete()

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
        serializer = PasswordResetSerializer(data=request.data, context={'user': user})
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data['password'])
        user.save(update_fields=['password'])
        return Response({'detail': 'Password updated.'}, status=status.HTTP_200_OK)
