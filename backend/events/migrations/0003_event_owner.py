from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def assign_existing_owners(apps, schema_editor):
    Event = apps.get_model('events', 'Event')
    for event in Event.objects.select_related('case').all():
        owner = event.attendees.order_by('id').first()
        if owner is None and event.case_id:
            owner = event.case.created_by
        if owner:
            event.created_by = owner
            event.save(update_fields=['created_by'])


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('cases', '0003_case_owner'),
        ('events', '0002_event_court_event_outcome_event_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='created_events',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(assign_existing_owners, migrations.RunPython.noop),
    ]
