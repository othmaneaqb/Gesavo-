from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def assign_existing_owners(apps, schema_editor):
    Task = apps.get_model('tasks', 'Task')
    for task in Task.objects.select_related('case').all():
        owner = task.assigned_to or (task.case.created_by if task.case_id else None)
        if owner:
            task.created_by = owner
            task.save(update_fields=['created_by'])


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('cases', '0003_case_owner'),
        ('tasks', '0003_task_archived_at_task_completed_at_task_is_archived'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='created_tasks',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(assign_existing_owners, migrations.RunPython.noop),
    ]
