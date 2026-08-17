from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def assign_existing_owners(apps, schema_editor):
    Case = apps.get_model('cases', 'Case')
    for case in Case.objects.select_related('client').all():
        owner = case.assigned_lawyers.order_by('id').first() or case.client.created_by
        if owner:
            case.created_by = owner
            case.save(update_fields=['created_by'])


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('clients', '0003_client_cabinet_and_owner'),
        ('cases', '0002_case_case_number_case_case_type_case_court_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='case',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='created_cases',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(assign_existing_owners, migrations.RunPython.noop),
    ]
