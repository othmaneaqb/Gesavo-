from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import Cabinet, CustomUser


class UserSecurityTests(APITestCase):
    ADMIN_PASSWORD = 'T9!xQ4#vN7@kL2$z'
    SUPERUSER_PASSWORD = 'B6@pW3!sJ8#rF5%h'
    LAWYER_PASSWORD = 'C8#tM4!qZ2@vK7&n'
    ASSISTANT_PASSWORD = 'D5$vR9!kP3@xN8#m'
    REPLACEMENT_PASSWORD = 'G7!mQ2#vL9@xR4$k'
    RESET_PASSWORD = 'H4@zT8!nC6#qW2%p'
    WEAK_PASSWORD = '1234567890123456'

    @classmethod
    def setUpTestData(cls):
        cls.cabinet = Cabinet.objects.create(
            name='Security Cabinet', slug='security-cabinet'
        )
        cls.admin = CustomUser.objects.create_user(
            username='security_admin',
            email='security.admin@example.test',
            password=cls.ADMIN_PASSWORD,
            role=CustomUser.Role.ADMIN,
            cabinet=cls.cabinet,
        )
        cls.superuser = CustomUser.objects.create_superuser(
            username='security_root',
            email='security.root@example.test',
            password=cls.SUPERUSER_PASSWORD,
            cabinet=cls.cabinet,
        )
        cls.lawyer = CustomUser.objects.create_user(
            username='security_lawyer',
            email='security.lawyer@example.test',
            password=cls.LAWYER_PASSWORD,
            role=CustomUser.Role.LAWYER,
            cabinet=cls.cabinet,
        )
        cls.assistant = CustomUser.objects.create_user(
            username='security_assistant',
            email='security.assistant@example.test',
            password=cls.ASSISTANT_PASSWORD,
            role=CustomUser.Role.ASSISTANT,
            cabinet=cls.cabinet,
        )

    def authenticate(self, user, password):
        self.client.credentials()
        response = self.client.post(
            '/api/users/login/',
            {'username': user.username, 'password': password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )

    def login_response(self, username, password):
        self.client.credentials()
        return self.client.post(
            '/api/users/login/',
            {'username': username, 'password': password},
            format='json',
        )

    def test_lawyer_cannot_administer_accounts_or_promote_users(self):
        self.authenticate(self.lawyer, self.LAWYER_PASSWORD)

        self.assertEqual(
            self.client.get('/api/users/manage/').status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(
                '/api/users/manage/',
                {
                    'username': 'lawyer_created',
                    'password': self.REPLACEMENT_PASSWORD,
                    'role': CustomUser.Role.ADMIN,
                },
                format='json',
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(
                '/api/users/register/',
                {
                    'username': 'lawyer_registered',
                    'password': self.REPLACEMENT_PASSWORD,
                    'role': CustomUser.Role.ADMIN,
                },
                format='json',
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.patch(
                f'/api/users/manage/{self.assistant.pk}/',
                {'role': CustomUser.Role.ADMIN},
                format='json',
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(
                f'/api/users/manage/{self.assistant.pk}/reset-password/',
                {'password': self.REPLACEMENT_PASSWORD},
                format='json',
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.delete(
                f'/api/users/manage/{self.assistant.pk}/'
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assistant.refresh_from_db()
        self.assertEqual(self.assistant.role, CustomUser.Role.ASSISTANT)
        self.assertTrue(self.assistant.check_password(self.ASSISTANT_PASSWORD))
        self.assertFalse(CustomUser.objects.filter(username='lawyer_created').exists())
        self.assertFalse(CustomUser.objects.filter(username='lawyer_registered').exists())

    def test_assistant_cannot_access_user_management(self):
        self.authenticate(self.assistant, self.ASSISTANT_PASSWORD)
        response = self.client.get('/api/users/manage/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_creation_hashes_password_and_new_user_can_login(self):
        self.authenticate(self.admin, self.ADMIN_PASSWORD)
        response = self.client.post(
            '/api/users/manage/',
            {
                'username': 'created_lawyer',
                'email': 'created.lawyer@example.test',
                'password': self.REPLACEMENT_PASSWORD,
                'role': CustomUser.Role.LAWYER,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('password', response.data)
        user = CustomUser.objects.get(username='created_lawyer')
        self.assertNotEqual(user.password, self.REPLACEMENT_PASSWORD)
        self.assertTrue(user.check_password(self.REPLACEMENT_PASSWORD))
        self.assertEqual(
            self.login_response(user.username, self.REPLACEMENT_PASSWORD).status_code,
            status.HTTP_200_OK,
        )

    def test_weak_password_is_rejected_by_both_creation_endpoints(self):
        self.authenticate(self.admin, self.ADMIN_PASSWORD)

        for endpoint, username in (
            ('/api/users/manage/', 'weak_managed'),
            ('/api/users/register/', 'weak_registered'),
        ):
            response = self.client.post(
                endpoint,
                {
                    'username': username,
                    'password': self.WEAK_PASSWORD,
                    'role': CustomUser.Role.ASSISTANT,
                },
                format='json',
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('password', response.data)
            self.assertFalse(CustomUser.objects.filter(username=username).exists())

    def test_managed_update_uses_set_password_and_authentication_succeeds(self):
        old_session = self.login_response(
            self.assistant.username, self.ASSISTANT_PASSWORD
        )
        old_access_token = old_session.data['access']
        old_refresh_token = old_session.data['refresh']
        self.authenticate(self.admin, self.ADMIN_PASSWORD)
        response = self.client.patch(
            f'/api/users/manage/{self.assistant.pk}/',
            {'password': self.REPLACEMENT_PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assistant.refresh_from_db()
        self.assertNotEqual(self.assistant.password, self.REPLACEMENT_PASSWORD)
        self.assertTrue(self.assistant.check_password(self.REPLACEMENT_PASSWORD))
        self.assertFalse(self.assistant.check_password(self.ASSISTANT_PASSWORD))
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {old_access_token}')
        self.assertEqual(
            self.client.get('/api/users/profile/').status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.client.credentials()
        self.assertEqual(
            self.client.post(
                '/api/users/login/refresh/',
                {'refresh': old_refresh_token},
                format='json',
            ).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(
            self.login_response(
                self.assistant.username, self.ASSISTANT_PASSWORD
            ).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(
            self.login_response(
                self.assistant.username, self.REPLACEMENT_PASSWORD
            ).status_code,
            status.HTTP_200_OK,
        )

    def test_only_admin_can_change_roles_and_admin_keeps_finance_access(self):
        self.authenticate(self.admin, self.ADMIN_PASSWORD)
        response = self.client.patch(
            f'/api/users/manage/{self.assistant.pk}/',
            {'role': CustomUser.Role.ADMIN},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assistant.refresh_from_db()
        self.assertEqual(self.assistant.role, CustomUser.Role.ADMIN)

        self.authenticate(self.assistant, self.ASSISTANT_PASSWORD)
        finance_response = self.client.get('/api/finance/transactions/')
        self.assertEqual(finance_response.status_code, status.HTTP_200_OK)

    def test_admin_cannot_demote_deactivate_or_delete_self(self):
        self.authenticate(self.admin, self.ADMIN_PASSWORD)

        demote = self.client.patch(
            f'/api/users/manage/{self.admin.pk}/',
            {'role': CustomUser.Role.LAWYER},
            format='json',
        )
        deactivate = self.client.patch(
            f'/api/users/manage/{self.admin.pk}/',
            {'is_active': False},
            format='json',
        )
        delete = self.client.delete(f'/api/users/manage/{self.admin.pk}/')

        self.assertEqual(demote.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(deactivate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(delete.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, CustomUser.Role.ADMIN)
        self.assertTrue(self.admin.is_active)

    def test_non_superuser_admin_cannot_access_superuser_account(self):
        self.authenticate(self.admin, self.ADMIN_PASSWORD)

        detail = self.client.get(f'/api/users/manage/{self.superuser.pk}/')
        update = self.client.patch(
            f'/api/users/manage/{self.superuser.pk}/',
            {'role': CustomUser.Role.LAWYER},
            format='json',
        )
        reset = self.client.post(
            f'/api/users/manage/{self.superuser.pk}/reset-password/',
            {'password': self.REPLACEMENT_PASSWORD},
            format='json',
        )

        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(update.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(reset.status_code, status.HTTP_404_NOT_FOUND)
        self.superuser.refresh_from_db()
        self.assertEqual(self.superuser.role, CustomUser.Role.ADMIN)
        self.assertTrue(self.superuser.check_password(self.SUPERUSER_PASSWORD))

    def test_administrative_reset_rejects_weak_password(self):
        self.authenticate(self.admin, self.ADMIN_PASSWORD)
        response = self.client.post(
            f'/api/users/manage/{self.assistant.pk}/reset-password/',
            {'password': self.WEAK_PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        self.assistant.refresh_from_db()
        self.assertTrue(self.assistant.check_password(self.ASSISTANT_PASSWORD))

    def test_public_reset_rejects_weak_password_without_changing_hash(self):
        uid = urlsafe_base64_encode(force_bytes(self.assistant.pk))
        token = default_token_generator.make_token(self.assistant)
        response = self.client.post(
            '/api/users/password-reset/confirm/',
            {
                'uid': uid,
                'token': token,
                'password': self.WEAK_PASSWORD,
                'password_confirm': self.WEAK_PASSWORD,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        self.assistant.refresh_from_db()
        self.assertTrue(self.assistant.check_password(self.ASSISTANT_PASSWORD))

    def test_public_reset_accepts_strong_password_and_invalidates_old_login(self):
        old_session = self.login_response(
            self.assistant.username, self.ASSISTANT_PASSWORD
        )
        old_access_token = old_session.data['access']
        old_refresh_token = old_session.data['refresh']
        uid = urlsafe_base64_encode(force_bytes(self.assistant.pk))
        token = default_token_generator.make_token(self.assistant)
        response = self.client.post(
            '/api/users/password-reset/confirm/',
            {
                'uid': uid,
                'token': token,
                'password': self.RESET_PASSWORD,
                'password_confirm': self.RESET_PASSWORD,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assistant.refresh_from_db()
        self.assertTrue(self.assistant.check_password(self.RESET_PASSWORD))
        self.assertFalse(self.assistant.check_password(self.ASSISTANT_PASSWORD))
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {old_access_token}')
        self.assertEqual(
            self.client.get('/api/users/profile/').status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.client.credentials()
        self.assertEqual(
            self.client.post(
                '/api/users/login/refresh/',
                {'refresh': old_refresh_token},
                format='json',
            ).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(
            self.login_response(
                self.assistant.username, self.ASSISTANT_PASSWORD
            ).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(
            self.login_response(
                self.assistant.username, self.RESET_PASSWORD
            ).status_code,
            status.HTTP_200_OK,
        )
