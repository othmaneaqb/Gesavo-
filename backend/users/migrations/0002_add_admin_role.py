from django.db import migrations, models


def promote_privileged_users(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    CustomUser.objects.filter(is_staff=True).update(role='ADMIN')
    CustomUser.objects.filter(is_superuser=True).update(role='ADMIN')


def demote_administrators(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    CustomUser.objects.filter(role='ADMIN').update(role='LAWYER')


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='role',
            field=models.CharField(
                choices=[
                    ('ADMIN', 'Administrator'),
                    ('LAWYER', 'Lawyer'),
                    ('ASSISTANT', 'Assistant'),
                ],
                default='ASSISTANT',
                help_text=(
                    'Administrators manage accounts, lawyers access legal and finance '
                    'data, and assistants do not have access to finance.'
                ),
                max_length=20,
            ),
        ),
        migrations.RunPython(promote_privileged_users, demote_administrators),
    ]
