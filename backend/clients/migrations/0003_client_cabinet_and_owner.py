from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def scope_existing_clients(apps, schema_editor):
    Cabinet = apps.get_model('users', 'Cabinet')
    CustomUser = apps.get_model('users', 'CustomUser')
    Client = apps.get_model('clients', 'Client')

    cabinet = Cabinet.objects.order_by('id').first()
    if cabinet is None:
        cabinet = Cabinet.objects.create(name='Cabinet principal', slug='cabinet-principal')
    owner = (
        CustomUser.objects.filter(cabinet=cabinet, role='LAWYER').order_by('id').first()
        or CustomUser.objects.filter(cabinet=cabinet).order_by('id').first()
    )
    Client.objects.filter(cabinet__isnull=True).update(cabinet=cabinet, created_by=owner)


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0003_cabinet_and_membership'),
        ('clients', '0002_client_national_id_alter_client_last_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='cabinet',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='clients',
                to='users.cabinet',
            ),
        ),
        migrations.AddField(
            model_name='client',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='created_clients',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(scope_existing_clients, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='client',
            name='cabinet',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='clients',
                to='users.cabinet',
            ),
        ),
        migrations.AlterField(
            model_name='client',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddConstraint(
            model_name='client',
            constraint=models.UniqueConstraint(
                fields=('cabinet', 'email'),
                name='clients_unique_email_per_cabinet',
            ),
        ),
    ]
