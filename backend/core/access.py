"""Central SQL scopes for cabinet and object-level access.

Every API list and detail endpoint must start from one of these querysets.  Object
permissions are a second line of defence; they are not a replacement for list
filtering.
"""

from django.db.models import Q


ADMIN = 'ADMIN'
LAWYER = 'LAWYER'
ASSISTANT = 'ASSISTANT'


def is_break_glass(user):
    return bool(user and user.is_authenticated and user.is_superuser)


def is_admin(user):
    return is_break_glass(user) or getattr(user, 'role', None) == ADMIN


def cabinet_id_for(user):
    return getattr(user, 'cabinet_id', None)


def accessible_users(user):
    from users.models import CustomUser

    queryset = CustomUser.objects.all()
    if is_break_glass(user):
        return queryset
    cabinet_id = cabinet_id_for(user)
    if not cabinet_id:
        return queryset.none()
    return queryset.filter(cabinet_id=cabinet_id)


def accessible_clients(user):
    from clients.models import Client

    queryset = Client.objects.all()
    if is_break_glass(user):
        return queryset
    cabinet_id = cabinet_id_for(user)
    if not cabinet_id:
        return queryset.none()
    queryset = queryset.filter(cabinet_id=cabinet_id)
    if is_admin(user):
        return queryset
    if user.role == LAWYER:
        return queryset.filter(
            Q(created_by=user)
            | Q(cases__created_by=user)
            | Q(cases__assigned_lawyers=user)
        ).distinct()
    if user.role == ASSISTANT:
        return queryset.filter(
            Q(cases__tasks__assigned_to=user)
            | Q(cases__events__attendees=user)
            | Q(cases__case_notes__author=user)
            | Q(cases__documents__uploaded_by=user)
            | Q(client_notes__author=user)
            | Q(documents__uploaded_by=user)
        ).distinct()
    return queryset.none()


def accessible_cases(user):
    from cases.models import Case

    queryset = Case.objects.select_related('client', 'created_by')
    if is_break_glass(user):
        return queryset
    cabinet_id = cabinet_id_for(user)
    if not cabinet_id:
        return queryset.none()
    queryset = queryset.filter(client__cabinet_id=cabinet_id)
    if is_admin(user):
        return queryset
    if user.role == LAWYER:
        return queryset.filter(Q(created_by=user) | Q(assigned_lawyers=user)).distinct()
    if user.role == ASSISTANT:
        return queryset.filter(
            Q(tasks__assigned_to=user)
            | Q(events__attendees=user)
            | Q(case_notes__author=user)
            | Q(documents__uploaded_by=user)
        ).distinct()
    return queryset.none()


def _task_cabinet_scope(queryset, user):
    cabinet_id = cabinet_id_for(user)
    return queryset.filter(
        Q(case__client__cabinet_id=cabinet_id)
        | Q(case__isnull=True, created_by__cabinet_id=cabinet_id)
        | Q(case__isnull=True, created_by__isnull=True, assigned_to__cabinet_id=cabinet_id)
    )


def accessible_tasks(user):
    from tasks.models import Task

    queryset = Task.objects.select_related('case__client', 'assigned_to', 'created_by')
    if is_break_glass(user):
        return queryset
    if not cabinet_id_for(user):
        return queryset.none()
    queryset = _task_cabinet_scope(queryset, user)
    if is_admin(user):
        return queryset
    if user.role == LAWYER:
        return queryset.filter(
            Q(created_by=user)
            | Q(case__isnull=True, assigned_to=user)
            | Q(case__in=accessible_cases(user))
        ).distinct()
    if user.role == ASSISTANT:
        return queryset.filter(Q(created_by=user) | Q(assigned_to=user)).distinct()
    return queryset.none()


def _event_cabinet_scope(queryset, user):
    cabinet_id = cabinet_id_for(user)
    return queryset.filter(
        Q(case__client__cabinet_id=cabinet_id)
        | Q(case__isnull=True, created_by__cabinet_id=cabinet_id)
        | Q(case__isnull=True, created_by__isnull=True, attendees__cabinet_id=cabinet_id)
    )


def accessible_events(user):
    from events.models import Event

    queryset = Event.objects.select_related('case__client', 'created_by')
    if is_break_glass(user):
        return queryset
    if not cabinet_id_for(user):
        return queryset.none()
    queryset = _event_cabinet_scope(queryset, user)
    if is_admin(user):
        return queryset.distinct()
    if user.role == LAWYER:
        return queryset.filter(
            Q(created_by=user)
            | Q(attendees=user)
            | Q(case__in=accessible_cases(user))
        ).distinct()
    if user.role == ASSISTANT:
        return queryset.filter(Q(created_by=user) | Q(attendees=user)).distinct()
    return queryset.none()


def accessible_notes(user):
    from notes.models import Note

    queryset = Note.objects.select_related('case__client', 'client', 'author')
    if is_break_glass(user):
        return queryset
    cabinet_id = cabinet_id_for(user)
    if not cabinet_id:
        return queryset.none()
    queryset = queryset.filter(
        Q(case__client__cabinet_id=cabinet_id)
        | Q(case__isnull=True, client__cabinet_id=cabinet_id)
        | Q(case__isnull=True, client__isnull=True, author__cabinet_id=cabinet_id)
    )
    if is_admin(user):
        return queryset
    if user.role in (LAWYER, ASSISTANT):
        return queryset.filter(
            Q(author=user)
            | Q(case__in=accessible_cases(user))
            | Q(client__in=accessible_clients(user))
        ).distinct()
    return queryset.none()


def accessible_documents(user):
    from documents.models import Document

    queryset = Document.objects.select_related('case__client', 'client', 'uploaded_by')
    if is_break_glass(user):
        return queryset
    cabinet_id = cabinet_id_for(user)
    if not cabinet_id:
        return queryset.none()
    queryset = queryset.filter(
        Q(case__client__cabinet_id=cabinet_id)
        | Q(case__isnull=True, client__cabinet_id=cabinet_id)
        | Q(case__isnull=True, client__isnull=True, uploaded_by__cabinet_id=cabinet_id)
    )
    if is_admin(user):
        return queryset
    if user.role in (LAWYER, ASSISTANT):
        return queryset.filter(
            Q(uploaded_by=user)
            | Q(case__in=accessible_cases(user))
            | Q(client__in=accessible_clients(user))
        ).distinct()
    return queryset.none()


def accessible_document_audit(user):
    from documents.models import DocumentAuditLog

    queryset = DocumentAuditLog.objects.select_related(
        'cabinet', 'actor', 'client', 'case'
    )
    if is_break_glass(user):
        return queryset
    cabinet_id = cabinet_id_for(user)
    if not cabinet_id:
        return queryset.none()
    queryset = queryset.filter(cabinet_id=cabinet_id)
    if is_admin(user):
        return queryset
    if user.role == LAWYER:
        return queryset.filter(
            Q(actor=user)
            | Q(client__in=accessible_clients(user))
            | Q(case__in=accessible_cases(user))
        ).distinct()
    if user.role == ASSISTANT:
        return queryset.filter(actor=user)
    return queryset.none()


def accessible_invoices(user):
    from finance.models import Invoice

    queryset = Invoice.objects.select_related('client', 'case', 'created_by')
    if is_break_glass(user):
        return queryset
    if not cabinet_id_for(user) or user.role not in (ADMIN, LAWYER):
        return queryset.none()
    if is_admin(user):
        return queryset.filter(client__cabinet_id=user.cabinet_id)
    return queryset.filter(client__in=accessible_clients(user)).distinct()


def accessible_payments(user):
    from finance.models import Payment

    return Payment.objects.select_related(
        'invoice__client', 'invoice__case', 'created_by'
    ).filter(
        invoice__in=accessible_invoices(user)
    ).distinct()


def accessible_transactions(user):
    from finance.models import Transaction

    queryset = Transaction.objects.select_related('client', 'case', 'created_by')
    if is_break_glass(user):
        return queryset
    if not cabinet_id_for(user) or user.role not in (ADMIN, LAWYER):
        return queryset.none()
    if is_admin(user):
        return queryset.filter(client__cabinet_id=user.cabinet_id)
    return queryset.filter(client__in=accessible_clients(user)).distinct()


def accessible_finance_audit(user):
    from finance.models import FinanceAuditLog

    queryset = FinanceAuditLog.objects.select_related(
        'cabinet', 'actor', 'client', 'case'
    )
    if is_break_glass(user):
        return queryset
    if not cabinet_id_for(user) or user.role not in (ADMIN, LAWYER):
        return queryset.none()
    queryset = queryset.filter(cabinet_id=user.cabinet_id)
    if is_admin(user):
        return queryset
    return queryset.filter(
        Q(actor=user) | Q(client__in=accessible_clients(user))
    ).distinct()


def object_cabinet_id(obj):
    """Resolve an object's canonical tenant without trusting request payloads."""
    label = obj._meta.label_lower
    if label in ('users.customuser', 'clients.client'):
        return obj.cabinet_id
    if label == 'cases.case':
        return obj.client.cabinet_id
    if label in ('tasks.task', 'events.event'):
        if obj.case_id:
            return obj.case.client.cabinet_id
        owner = obj.created_by
        if owner:
            return owner.cabinet_id
        if label == 'tasks.task' and obj.assigned_to:
            return obj.assigned_to.cabinet_id
        return None
    if label in ('notes.note', 'documents.document'):
        if obj.case_id:
            return obj.case.client.cabinet_id
        if obj.client_id:
            return obj.client.cabinet_id
        owner = obj.author if label == 'notes.note' else obj.uploaded_by
        return owner.cabinet_id if owner else None
    if label in ('finance.invoice', 'finance.transaction'):
        return obj.client.cabinet_id
    if label == 'finance.payment':
        return obj.invoice.client.cabinet_id
    if label == 'finance.financeauditlog':
        return obj.cabinet_id
    if label == 'documents.documentauditlog':
        return obj.cabinet_id
    return None


def same_cabinet(user, obj):
    return is_break_glass(user) or (
        cabinet_id_for(user) is not None
        and object_cabinet_id(obj) == cabinet_id_for(user)
    )
