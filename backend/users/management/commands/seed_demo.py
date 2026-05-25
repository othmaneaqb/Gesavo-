from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from clients.models import Client
from cases.models import Case
from tasks.models import Task
from events.models import Event
from notes.models import Note
from finance.models import Transaction
from users.models import CustomUser


class Command(BaseCommand):
    help = "Seed demo records for local development."

    def handle(self, *args, **options):
        user, _ = CustomUser.objects.get_or_create(
            username="demo",
            defaults={
                "email": "demo@example.com",
                "first_name": "Demo",
                "last_name": "User",
                "role": CustomUser.Role.LAWYER,
            },
        )
        user.set_password("Demo12345!")
        user.save()

        assistant, _ = CustomUser.objects.get_or_create(
            username="assistant",
            defaults={
                "email": "assistant@example.com",
                "first_name": "Assistant",
                "last_name": "User",
                "role": CustomUser.Role.ASSISTANT,
            },
        )
        assistant.set_password("Assistant12345!")
        assistant.save()

        ibrahim, _ = Client.objects.get_or_create(
            email="ibrahim@example.com",
            defaults={
                "first_name": "Ibrahim",
                "last_name": "Al-Rashid",
                "phone": "+966 50 123 4567",
                "address": "Riyadh, Saudi Arabia",
                "notes": "High-value client, prefers morning calls.",
            },
        )

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
            },
        )
        case.assigned_lawyers.add(user)

        Task.objects.get_or_create(
            title="Prepare brief for property dispute",
            defaults={
                "priority": "high",
                "status": Task.Status.IN_PROGRESS,
                "due_date": timezone.localdate() + timedelta(days=4),
                "case": case,
                "assigned_to": user,
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
