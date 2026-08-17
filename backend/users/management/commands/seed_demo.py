import os
from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from clients.models import Client
from cases.models import Case
from tasks.models import Task
from events.models import Event
from notes.models import Note
from finance.models import Transaction
from users.models import Cabinet, CustomUser


class Command(BaseCommand):
    help = "Seed demo records for local development."

    def handle(self, *args, **options):
        demo_password = os.environ.get("GESAVO_DEMO_PASSWORD")
        assistant_password = os.environ.get("GESAVO_ASSISTANT_PASSWORD")
        if not demo_password or not assistant_password:
            raise CommandError(
                "GESAVO_DEMO_PASSWORD and GESAVO_ASSISTANT_PASSWORD are required. "
                "Set unique local values before running seed_demo."
            )

        password_candidates = (
            (
                'GESAVO_DEMO_PASSWORD',
                demo_password,
                CustomUser(
                    username='demo',
                    email='demo@example.com',
                    role=CustomUser.Role.LAWYER,
                ),
            ),
            (
                'GESAVO_ASSISTANT_PASSWORD',
                assistant_password,
                CustomUser(
                    username='assistant',
                    email='assistant@example.com',
                    role=CustomUser.Role.ASSISTANT,
                ),
            ),
        )
        for variable_name, password, candidate in password_candidates:
            try:
                validate_password(password, user=candidate)
            except ValidationError as exc:
                raise CommandError(
                    f"{variable_name} is not strong enough: {' '.join(exc.messages)}"
                ) from exc

        cabinet, _ = Cabinet.objects.get_or_create(
            slug='cabinet-demo',
            defaults={'name': os.environ.get('GESAVO_CABINET_NAME', 'Cabinet Demo')},
        )

        user, _ = CustomUser.objects.get_or_create(
            username="demo",
            defaults={
                "email": "demo@example.com",
                "first_name": "Demo",
                "last_name": "User",
                "role": CustomUser.Role.LAWYER,
                "cabinet": cabinet,
            },
        )
        user.cabinet = cabinet
        user.set_password(demo_password)
        user.save(update_fields=['cabinet', 'password'])

        assistant, _ = CustomUser.objects.get_or_create(
            username="assistant",
            defaults={
                "email": "assistant@example.com",
                "first_name": "Assistant",
                "last_name": "User",
                "role": CustomUser.Role.ASSISTANT,
                "cabinet": cabinet,
            },
        )
        assistant.cabinet = cabinet
        assistant.set_password(assistant_password)
        assistant.save(update_fields=['cabinet', 'password'])

        ibrahim, _ = Client.objects.get_or_create(
            email="ibrahim@example.com",
            defaults={
                "first_name": "Ibrahim",
                "last_name": "Al-Rashid",
                "phone": "+966 50 123 4567",
                "address": "Riyadh, Saudi Arabia",
                "notes": "High-value client, prefers morning calls.",
                "cabinet": cabinet,
                "created_by": user,
            },
        )
        if ibrahim.cabinet_id != cabinet.id or not ibrahim.created_by_id:
            ibrahim.cabinet = cabinet
            ibrahim.created_by = user
            ibrahim.save(update_fields=['cabinet', 'created_by'])

        case, _ = Case.objects.get_or_create(
            case_number="2026-CIV-001",
            defaults={
                "title": "Al-Rashid Property Dispute",
                "case_type": "civil",
                "court": "Riyadh Civil Court",
                "judge": "Hon. Khalid Al-Otaibi",
                "status": Case.Status.OPEN,
                "next_hearing": timezone.localdate() + timedelta(days=7),
                "client": ibrahim,
                "created_by": user,
            },
        )
        if not case.created_by_id:
            case.created_by = user
            case.save(update_fields=['created_by'])
        case.assigned_lawyers.add(user)

        Task.objects.get_or_create(
            title="Prepare brief for property dispute",
            defaults={
                "priority": "high",
                "status": Task.Status.IN_PROGRESS,
                "due_date": timezone.localdate() + timedelta(days=4),
                "case": case,
                "assigned_to": user,
                "created_by": user,
            },
        )

        start = timezone.now() + timedelta(days=7)
        Event.objects.get_or_create(
            title="Property Dispute — Preliminary Hearing",
            case=case,
            defaults={
                "court": "Riyadh Civil Court",
                "status": "UPCOMING",
                "start_time": start,
                "end_time": start + timedelta(hours=1),
                "created_by": user,
            },
        )

        Note.objects.get_or_create(
            title="Strategy Notes",
            client=ibrahim,
            defaults={
                "content": "Consider settlement options before the next hearing.",
                "author": user,
            },
        )

        Transaction.objects.get_or_create(
            description="Initial retainer",
            client=ibrahim,
            defaults={
                "case": case,
                "amount": 15000,
                "date": timezone.localdate(),
                "type": Transaction.Type.INVOICE,
                "status": Transaction.Status.OUTSTANDING,
            },
        )
        Transaction.objects.get_or_create(
            description="Retainer payment",
            client=ibrahim,
            defaults={
                "case": case,
                "amount": 5000,
                "date": timezone.localdate(),
                "type": Transaction.Type.PAYMENT,
                "status": Transaction.Status.PAID,
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))
