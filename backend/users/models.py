from django.contrib.auth.models import AbstractUser
from django.db import models


class Cabinet(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name

class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrator'
        LAWYER = 'LAWYER', 'Lawyer'
        ASSISTANT = 'ASSISTANT', 'Assistant'
    
    role = models.CharField(
        max_length=20, 
        choices=Role.choices, 
        default=Role.ASSISTANT,
        help_text=(
            "Administrators manage accounts, lawyers access legal and finance data, "
            "and assistants do not have access to finance."
        )
    )
    cabinet = models.ForeignKey(
        Cabinet,
        on_delete=models.PROTECT,
        related_name='members',
        blank=True,
        null=True,
        help_text='Required for every non-superuser account.',
    )

    class Meta(AbstractUser.Meta):
        constraints = [
            models.CheckConstraint(
                condition=models.Q(cabinet__isnull=False) | models.Q(is_superuser=True),
                name='users_user_cabinet_or_superuser',
            )
        ]

    def save(self, *args, **kwargs):
        # A Django superuser is the break-glass administrator and must never be
        # represented to API clients as a lower-privileged business role.
        if self.is_superuser:
            self.role = self.Role.ADMIN
            if kwargs.get('update_fields') is not None:
                kwargs['update_fields'] = set(kwargs['update_fields']) | {'role'}
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
