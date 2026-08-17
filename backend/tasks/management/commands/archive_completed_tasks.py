import time
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from tasks.models import Task


class Command(BaseCommand):
    help = 'Archive completed tasks after the configured retention period.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--older-than-hours',
            type=int,
            default=settings.TASK_ARCHIVE_AFTER_HOURS,
        )
        parser.add_argument('--watch', action='store_true')
        parser.add_argument(
            '--interval-seconds',
            type=int,
            default=settings.TASK_ARCHIVE_INTERVAL_SECONDS,
        )

    def handle(self, *args, **options):
        older_than_hours = options['older_than_hours']
        interval_seconds = options['interval_seconds']
        if older_than_hours <= 0:
            raise CommandError('--older-than-hours must be positive.')
        if options['watch'] and interval_seconds <= 0:
            raise CommandError('--interval-seconds must be positive in watch mode.')

        while True:
            archived = self.archive_eligible_tasks(older_than_hours)
            self.stdout.write(
                f'Archived {archived} completed task(s).'
            )
            if not options['watch']:
                return
            time.sleep(interval_seconds)

    @staticmethod
    def archive_eligible_tasks(older_than_hours):
        now = timezone.now()
        cutoff = now - timedelta(hours=older_than_hours)
        with transaction.atomic():
            return Task.objects.filter(
                status=Task.Status.COMPLETED,
                is_archived=False,
                completed_at__isnull=False,
                completed_at__lte=cutoff,
            ).update(is_archived=True, archived_at=now)
