from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import get_md5_hash_password

from .models import CustomUser


PASSWORD_USER_FIELDS = ('username', 'email', 'first_name', 'last_name', 'role')


def password_validation_user(attrs, instance=None):
    """Build a side-effect-free user carrying attributes used by validators."""
    values = {
        field: attrs.get(field, getattr(instance, field, ''))
        for field in PASSWORD_USER_FIELDS
    }
    return CustomUser(**values)


def validate_user_password(password, user):
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(list(exc.messages)) from exc


class ValidatedPasswordModelSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
        trim_whitespace=False,
        style={'input_type': 'password'},
    )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        password = attrs.get('password')
        if self.instance is None and not password:
            raise serializers.ValidationError({'password': 'This field is required.'})
        if password:
            candidate = password_validation_user(attrs, self.instance)
            try:
                validate_user_password(password, candidate)
            except serializers.ValidationError as exc:
                raise serializers.ValidationError({'password': exc.detail}) from exc
        return attrs


class UserSerializer(serializers.ModelSerializer):
    cabinet_name = serializers.CharField(source='cabinet.name', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'cabinet', 'cabinet_name',
        )
        read_only_fields = ('id', 'role', 'cabinet', 'cabinet_name')


class TeamMemberSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'first_name', 'last_name', 'display_name', 'role')
        read_only_fields = fields

    def get_display_name(self, obj):
        return obj.get_full_name().strip() or obj.username


class RegisterSerializer(ValidatedPasswordModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'role')
        read_only_fields = ('id',)

    def create(self, validated_data):
        password = validated_data.pop('password')
        return CustomUser.objects.create_user(password=password, **validated_data)


class ManagedUserSerializer(ValidatedPasswordModelSerializer):
    cabinet_name = serializers.CharField(source='cabinet.name', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'cabinet',
            'cabinet_name',
        )
        read_only_fields = ('id', 'cabinet', 'cabinet_name')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get('request')

        if self.instance and request and request.user.pk == self.instance.pk:
            if attrs.get('role', self.instance.role) != self.instance.role:
                raise serializers.ValidationError(
                    {'role': 'You cannot change your own administrator role.'}
                )
            if attrs.get('is_active', self.instance.is_active) is False:
                raise serializers.ValidationError(
                    {'is_active': 'You cannot deactivate your own account.'}
                )

        if (
            self.instance
            and self.instance.is_superuser
            and attrs.get('role', self.instance.role) != CustomUser.Role.ADMIN
        ):
            raise serializers.ValidationError(
                {'role': 'A superuser must retain the administrator role.'}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        return CustomUser.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=['password'])
        return user


class PasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(
        write_only=True,
        allow_blank=False,
        trim_whitespace=False,
        style={'input_type': 'password'},
    )

    def validate_password(self, value):
        user = self.context['user']
        validate_user_password(value, user)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        allow_blank=False,
        trim_whitespace=False,
        style={'input_type': 'password'},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        allow_blank=False,
        trim_whitespace=False,
        style={'input_type': 'password'},
    )

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {'password_confirm': 'Passwords do not match.'}
            )

        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = CustomUser.objects.get(pk=uid, is_active=True)
        except (
            TypeError,
            ValueError,
            OverflowError,
            UnicodeDecodeError,
            CustomUser.DoesNotExist,
        ) as exc:
            raise serializers.ValidationError(
                {'detail': 'Invalid or expired reset link.'}
            ) from exc

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError(
                {'detail': 'Invalid or expired reset link.'}
            )

        try:
            validate_user_password(attrs['password'], user)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({'password': exc.detail}) from exc

        attrs['user'] = user
        return attrs


class PasswordAwareTokenRefreshSerializer(TokenRefreshSerializer):
    """Reject refresh tokens issued before the current password hash."""

    def validate(self, attrs):
        refresh = self.token_class(attrs['refresh'])
        user_id = refresh.payload.get(api_settings.USER_ID_CLAIM)

        try:
            user = CustomUser.objects.get(
                **{api_settings.USER_ID_FIELD: user_id},
                is_active=True,
            )
        except CustomUser.DoesNotExist as exc:
            raise AuthenticationFailed(
                'No active account found for the given token.',
                code='no_active_account',
            ) from exc

        if refresh.get(api_settings.REVOKE_TOKEN_CLAIM) != get_md5_hash_password(
            user.password
        ):
            raise AuthenticationFailed(
                'The user password has been changed.',
                code='password_changed',
            )

        return super().validate(attrs)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_refresh(self, value):
        try:
            self.refresh_token = RefreshToken(value)
        except TokenError as exc:
            raise serializers.ValidationError('Invalid or expired refresh token.') from exc
        return value

    def save(self, **kwargs):
        self.refresh_token.blacklist()
