from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from users.models import Cabinet, CustomUser


class JwtLifecycleTests(APITestCase):
    PASSWORD = 'L8!sQ2#vT7@kN4%w'

    @classmethod
    def setUpTestData(cls):
        cls.cabinet = Cabinet.objects.create(name='JWT Cabinet', slug='jwt-cabinet')
        cls.user = CustomUser.objects.create_user(
            username='jwt_lifecycle_user',
            email='jwt.lifecycle@example.test',
            password=cls.PASSWORD,
            role=CustomUser.Role.LAWYER,
            cabinet=cls.cabinet,
        )

    def login(self):
        response = self.client.post(
            '/api/users/login/',
            {'username': self.user.username, 'password': self.PASSWORD},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data

    def test_access_token_expires_after_fifteen_minutes(self):
        tokens = self.login()
        access = AccessToken(tokens['access'])
        lifetime = access['exp'] - access['iat']
        self.assertGreaterEqual(lifetime, (15 * 60) - 1)
        self.assertLessEqual(lifetime, 15 * 60)

    def test_refresh_rotates_and_previous_refresh_is_blacklisted(self):
        tokens = self.login()
        first_refresh = tokens['refresh']

        rotated = self.client.post(
            '/api/users/login/refresh/',
            {'refresh': first_refresh},
            format='json',
        )
        self.assertEqual(rotated.status_code, status.HTTP_200_OK)
        self.assertIn('access', rotated.data)
        self.assertIn('refresh', rotated.data)
        self.assertNotEqual(rotated.data['refresh'], first_refresh)

        reused = self.client.post(
            '/api/users/login/refresh/',
            {'refresh': first_refresh},
            format='json',
        )
        self.assertEqual(reused.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_refresh_token(self):
        tokens = self.login()
        logout = self.client.post(
            '/api/users/logout/',
            {'refresh': tokens['refresh']},
            format='json',
        )
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)

        reused = self.client.post(
            '/api/users/login/refresh/',
            {'refresh': tokens['refresh']},
            format='json',
        )
        self.assertEqual(reused.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_missing_or_invalid_refresh_token(self):
        missing = self.client.post('/api/users/logout/', {}, format='json')
        invalid = self.client.post(
            '/api/users/logout/',
            {'refresh': 'not-a-jwt'},
            format='json',
        )

        self.assertEqual(missing.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_access_and_refresh_tokens_are_not_interchangeable(self):
        tokens = self.login()

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {tokens['refresh']}"
        )
        profile = self.client.get('/api/users/profile/')
        self.assertEqual(profile.status_code, status.HTTP_401_UNAUTHORIZED)

        wrong_refresh = self.client.post(
            '/api/users/login/refresh/',
            {'refresh': tokens['access']},
            format='json',
        )
        self.assertEqual(wrong_refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tampered_access_token_is_rejected(self):
        tokens = self.login()
        header, payload, signature = tokens['access'].split('.')
        replacement = 'A' if signature[0] != 'A' else 'B'
        tampered = '.'.join((header, payload, replacement + signature[1:]))

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tampered}')
        response = self.client.get('/api/users/profile/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivated_user_cannot_use_an_existing_access_token(self):
        tokens = self.login()
        self.user.is_active = False
        self.user.save(update_fields=('is_active',))

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {tokens['access']}"
        )
        response = self.client.get('/api/users/profile/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
