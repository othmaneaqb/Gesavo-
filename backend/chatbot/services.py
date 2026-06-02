from datetime import timedelta
import json
import os
import re
import urllib.request
import urllib.error

from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from clients.models import Client
from cases.models import Case
from tasks.models import Task
from events.models import Event
from documents.models import Document
from notes.models import Note
from finance.models import Transaction


MAX_ITEMS = 12


def _safe(value, fallback='—'):
    return value if value not in (None, '') else fallback


def _date(value):
    if not value:
        return ''
    return value.isoformat() if hasattr(value, 'isoformat') else str(value)


def user_can_view_finance(user):
    return bool(user and user.is_authenticated and getattr(user, 'role', '') == 'LAWYER')


def _normalize(value):
    return (value or '').strip().lower()


def _find_case_from_text(text):
    normalized = _normalize(text)
    if not normalized:
        return None
    for case in Case.objects.select_related('client').all():
        candidates = [
            case.case_number,
            case.title,
            f'{case.client.first_name} {case.client.last_name}'.strip() if case.client_id else '',
        ]
        if any(candidate and _normalize(candidate) in normalized for candidate in candidates):
            return case
    return None


def _find_client_from_text(text):
    normalized = _normalize(text)
    if not normalized:
        return None
    for client in Client.objects.all():
        candidates = [
            f'{client.first_name} {client.last_name}'.strip(),
            client.first_name,
            client.last_name,
            client.email,
            client.national_id,
        ]
        if any(candidate and _normalize(candidate) in normalized for candidate in candidates):
            return client
    return None


def _find_task_from_text(text):
    normalized = _normalize(text)
    if not normalized:
        return None
    id_match = re.search(r'(?:task|tâche|tache|id)\s*#?\s*(\d+)', normalized)
    if id_match:
        task = Task.objects.filter(id=int(id_match.group(1))).first()
        if task:
            return task
    for task in Task.objects.select_related('case').all():
        if task.title and _normalize(task.title) in normalized:
            return task
    return None


def _extract_action_title(message, fallback):
    clean = re.sub(r'\s+', ' ', message).strip()
    patterns = [
        r'(?:crée|cree|créer|creer|ajoute|add|create)\s+(?:une\s+)?(?:tâche|tache|task|note)\s*(?:pour|:|-)?\s*(.*)',
        r'(?:nouvelle\s+)?(?:tâche|tache|task|note)\s*(?:pour|:|-)?\s*(.*)',
    ]
    for pattern in patterns:
        match = re.search(pattern, clean, flags=re.IGNORECASE)
        if match and match.group(1).strip():
            return match.group(1).strip()[:180]
    return fallback


def _status_from_text(message, kind):
    text = _normalize(message)
    if kind == 'task':
        if any(word in text for word in ['termin', 'done', 'completed', 'complete']):
            return Task.Status.COMPLETED
        if any(word in text for word in ['progress', 'cours']):
            return Task.Status.IN_PROGRESS
        if any(word in text for word in ['todo', 'pending', 'attente', 'à faire', 'a faire']):
            return Task.Status.PENDING
    if kind == 'case':
        if any(word in text for word in ['ferm', 'closed', 'clotur', 'clôtur']):
            return Case.Status.CLOSED
        if any(word in text for word in ['pending', 'attente', 'suspend']):
            return Case.Status.PENDING
        if any(word in text for word in ['open', 'ouvert', 'active', 'actif']):
            return Case.Status.OPEN
    return None


def propose_actions(message):
    text = _normalize(message)
    actions = []

    wants_create = any(word in text for word in ['crée', 'cree', 'créer', 'creer', 'ajoute', 'add', 'create'])
    mentions_task = any(word in text for word in ['tâche', 'tache', 'task'])
    mentions_note = 'note' in text

    if wants_create and mentions_task:
        case = _find_case_from_text(message)
        title = _extract_action_title(message, 'Nouvelle tâche')
        actions.append({
            'type': 'create_task',
            'label': f'Créer la tâche “{title}”',
            'payload': {
                'title': title,
                'description': f'Créée depuis le chatbot à partir de la demande : {message}',
                'priority': 'normal',
                'case_id': case.id if case else None,
            }
        })

    if wants_create and mentions_note:
        case = _find_case_from_text(message)
        client = _find_client_from_text(message)
        content = _extract_action_title(message, message)
        actions.append({
            'type': 'add_note',
            'label': 'Ajouter cette note',
            'payload': {
                'title': 'Note chatbot',
                'content': content,
                'case_id': case.id if case else None,
                'client_id': client.id if client else None,
            }
        })

    if any(word in text for word in ['statut', 'status', 'marque', 'changer', 'change', 'mets', 'met ']) and mentions_task:
        task = _find_task_from_text(message)
        status = _status_from_text(message, 'task')
        if task and status:
            actions.append({
                'type': 'update_task_status',
                'label': f'Mettre la tâche “{task.title}” en {status}',
                'payload': {'task_id': task.id, 'status': status}
            })

    if any(word in text for word in ['statut', 'status', 'ferme', 'ouvrir', 'mets', 'met ']) and any(word in text for word in ['dossier', 'case', 'affaire']):
        case = _find_case_from_text(message)
        status = _status_from_text(message, 'case')
        if case and status:
            actions.append({
                'type': 'update_case_status',
                'label': f'Mettre le dossier “{case.case_number or case.title}” en {status}',
                'payload': {'case_id': case.id, 'status': status}
            })

    return actions[:3]


def build_cabinet_context(user):
    """Build a controlled, role-aware snapshot for the assistant.

    The chatbot never receives raw unrestricted database access. This function
    decides exactly which fields can be used in answers.
    """
    today = timezone.localdate()
    soon = today + timedelta(days=7)

    clients = list(Client.objects.all().order_by('-created_at')[:MAX_ITEMS])
    cases = list(Case.objects.select_related('client').all().order_by('-created_at')[:MAX_ITEMS])
    tasks = list(Task.objects.select_related('case').all().order_by('due_date', '-created_at')[:MAX_ITEMS * 2])
    events = list(Event.objects.select_related('case').all().order_by('start_time')[:MAX_ITEMS * 2])
    documents = list(Document.objects.select_related('client', 'case').all().order_by('-uploaded_at')[:MAX_ITEMS])
    notes = list(Note.objects.select_related('client', 'case', 'author').all().order_by('-created_at')[:MAX_ITEMS])

    active_tasks = [task for task in tasks if not task.is_archived and task.status != Task.Status.COMPLETED]
    overdue_tasks = [task for task in active_tasks if task.due_date and task.due_date < today]
    upcoming_tasks = [task for task in active_tasks if task.due_date and today <= task.due_date <= soon]
    upcoming_events = [event for event in events if event.start_time.date() >= today and event.start_time.date() <= soon]

    context = {
        'user': {
            'username': user.username,
            'role': getattr(user, 'role', ''),
            'can_view_finance': user_can_view_finance(user),
        },
        'summary': {
            'clients_count': Client.objects.count(),
            'cases_count': Case.objects.count(),
            'open_cases_count': Case.objects.exclude(status=Case.Status.CLOSED).count(),
            'tasks_count': Task.objects.count(),
            'active_tasks_count': len(active_tasks),
            'overdue_tasks_count': len(overdue_tasks),
            'upcoming_hearings_count': len(upcoming_events),
            'documents_count': Document.objects.count(),
            'notes_count': Note.objects.count(),
        },
        'clients': [
            {
                'id': client.id,
                'name': f'{client.first_name} {client.last_name}'.strip(),
                'email': _safe(client.email),
                'phone': _safe(client.phone),
                'national_id': _safe(client.national_id),
            }
            for client in clients
        ],
        'cases': [
            {
                'id': case.id,
                'title': case.title,
                'case_number': _safe(case.case_number),
                'type': _safe(case.case_type),
                'status': case.status,
                'court': _safe(case.court),
                'judge': _safe(case.judge),
                'client': f'{case.client.first_name} {case.client.last_name}'.strip() if case.client_id else '—',
                'next_hearing': _date(case.next_hearing),
                'description': _safe(case.description, ''),
            }
            for case in cases
        ],
        'tasks': [
            {
                'id': task.id,
                'title': task.title,
                'status': task.status,
                'priority': _safe(task.priority, 'normal'),
                'due_date': _date(task.due_date),
                'case': task.case.case_number if task.case_id else '—',
                'is_archived': task.is_archived,
            }
            for task in tasks[:MAX_ITEMS]
        ],
        'overdue_tasks': [
            {
                'id': task.id,
                'title': task.title,
                'priority': _safe(task.priority, 'normal'),
                'due_date': _date(task.due_date),
                'case': task.case.case_number if task.case_id else '—',
            }
            for task in overdue_tasks[:MAX_ITEMS]
        ],
        'upcoming_tasks': [
            {
                'id': task.id,
                'title': task.title,
                'priority': _safe(task.priority, 'normal'),
                'due_date': _date(task.due_date),
                'case': task.case.case_number if task.case_id else '—',
            }
            for task in upcoming_tasks[:MAX_ITEMS]
        ],
        'hearings': [
            {
                'id': event.id,
                'title': event.title,
                'court': _safe(event.court),
                'status': event.status,
                'start_time': _date(event.start_time),
                'case': event.case.case_number if event.case_id else '—',
                'outcome': _safe(event.outcome, ''),
            }
            for event in upcoming_events[:MAX_ITEMS]
        ],
        'documents': [
            {
                'id': doc.id,
                'title': doc.title,
                'client': f'{doc.client.first_name} {doc.client.last_name}'.strip() if doc.client_id else '—',
                'case': doc.case.case_number if doc.case_id else '—',
                'uploaded_at': _date(doc.uploaded_at),
            }
            for doc in documents
        ],
        'notes': [
            {
                'id': note.id,
                'title': _safe(note.title, 'Note'),
                'content_preview': note.content[:240],
                'client': f'{note.client.first_name} {note.client.last_name}'.strip() if note.client_id else '—',
                'case': note.case.case_number if note.case_id else '—',
                'created_at': _date(note.created_at),
            }
            for note in notes
        ],
    }

    if user_can_view_finance(user):
        transactions = list(Transaction.objects.select_related('client', 'case').all().order_by('-date', '-id')[:MAX_ITEMS])
        total_invoice = sum(float(item.amount) for item in Transaction.objects.filter(type=Transaction.Type.INVOICE))
        total_payment = sum(float(item.amount) for item in Transaction.objects.filter(type=Transaction.Type.PAYMENT))
        context['finance'] = {
            'total_invoiced': total_invoice,
            'total_paid': total_payment,
            'outstanding': total_invoice - total_payment,
            'recent_transactions': [
                {
                    'id': tx.id,
                    'type': tx.type,
                    'description': tx.description,
                    'amount': float(tx.amount),
                    'status': _safe(tx.status),
                    'date': _date(tx.date),
                    'client': f'{tx.client.first_name} {tx.client.last_name}'.strip() if tx.client_id else '—',
                    'case': tx.case.case_number if tx.case_id else '—',
                }
                for tx in transactions
            ]
        }

    return context


def local_answer(message, context, language='fr'):
    """Useful deterministic fallback when no external AI provider is configured."""
    text = message.lower()
    summary = context['summary']
    is_ar = language == 'ar'
    is_en = language == 'en'

    if any(word in text for word in ['finance', 'facture', 'paiement', 'payé', 'paye', 'montant', 'argent']):
        if not context['user']['can_view_finance']:
            return "Vous n’avez pas l’autorisation d’accéder aux informations financières. Cette partie est réservée au rôle avocat."
        finance = context.get('finance', {})
        return (
            "Résumé financier du cabinet :\n"
            f"- Total facturé : {finance.get('total_invoiced', 0):,.2f}\n"
            f"- Total payé : {finance.get('total_paid', 0):,.2f}\n"
            f"- Restant dû : {finance.get('outstanding', 0):,.2f}\n"
            "Je peux aussi lister les transactions récentes si vous me le demandez."
        )

    if any(word in text for word in ['retard', 'overdue', 'late']):
        tasks = context['overdue_tasks']
        if not tasks:
            return "Aucune tâche en retard n’est détectée actuellement."
        lines = ["Tâches en retard :"]
        for task in tasks:
            lines.append(f"- {task['title']} · dossier {task['case']} · échéance {task['due_date']} · priorité {task['priority']}")
        return "\n".join(lines)

    if any(word in text for word in ['audience', 'hearing', 'calendrier', 'semaine']):
        hearings = context['hearings']
        if not hearings:
            return "Aucune audience prévue dans les 7 prochains jours."
        lines = ["Audiences à venir dans les 7 prochains jours :"]
        for hearing in hearings:
            lines.append(f"- {hearing['title']} · {hearing['court']} · {hearing['start_time']} · dossier {hearing['case']}")
        return "\n".join(lines)

    if any(word in text for word in ['tâche', 'tache', 'task']):
        tasks = context['upcoming_tasks'] or context['tasks']
        if not tasks:
            return "Aucune tâche active n’est disponible pour le moment."
        lines = ["Voici les tâches les plus pertinentes :"]
        for task in tasks[:8]:
            lines.append(f"- {task['title']} · statut {task.get('status', '—')} · priorité {task['priority']} · échéance {task['due_date'] or '—'}")
        return "\n".join(lines)

    if any(word in text for word in ['client', 'clients']):
        clients = context['clients']
        if not clients:
            return "Aucun client n’est enregistré actuellement."
        lines = [f"Le cabinet contient {summary['clients_count']} client(s). Exemples récents :"]
        for client in clients[:8]:
            lines.append(f"- {client['name']} · {client['email']} · {client['phone']}")
        return "\n".join(lines)

    if any(word in text for word in ['dossier', 'case', 'affaire']):
        cases = context['cases']
        if not cases:
            return "Aucun dossier n’est enregistré actuellement."
        lines = [f"{'????? ?????? ???' if is_ar else 'The firm has' if is_en else 'Le cabinet contient'} {summary['cases_count']} {'???(??)? ????' if is_ar else 'case(s), including' if is_en else 'dossier(s), dont'} {summary['open_cases_count']} {'??????.' if is_ar else 'open.' if is_en else 'ouvert(s).'}"]
        for case in cases[:8]:
            lines.append(f"- {case['case_number']} · {case['title']} · {case['status']} · client {case['client']}")
        return "\n".join(lines)

    if any(word in text for word in ['document', 'documents', 'fichier']):
        docs = context['documents']
        if not docs:
            return "Aucun document n’est enregistré actuellement."
        lines = [f"Le cabinet contient {summary['documents_count']} document(s). Documents récents :"]
        for doc in docs[:8]:
            lines.append(f"- {doc['title']} · client {doc['client']} · dossier {doc['case']}")
        return "\n".join(lines)

    if any(word in text for word in ['note', 'notes', 'résume', 'resume']):
        notes = context['notes']
        if not notes:
            return "Aucune note n’est enregistrée actuellement."
        lines = ["Notes récentes :"]
        for note in notes[:6]:
            lines.append(f"- {note['title']} · {note['content_preview']}")
        return "\n".join(lines)

    return (
        "Je peux répondre aux questions générales et aux questions liées aux données du cabinet. "
        "Dans cette première version sécurisée, j’ai accès en lecture seule aux clients, dossiers, tâches, audiences, documents et notes. "
        f"Résumé actuel : {summary['clients_count']} client(s), {summary['cases_count']} dossier(s), "
        f"{summary['active_tasks_count']} tâche(s) active(s), {summary['upcoming_hearings_count']} audience(s) proche(s). "
        "Essayez par exemple : “quelles tâches sont en retard ?”, “résume les dossiers ouverts”, ou “quelles audiences cette semaine ?”."
    )


def call_external_ai(message, context, history=None, language='fr'):
    """Optional Mistral/OpenAI-compatible call. Returns (answer, diagnostic)."""
    api_key = os.environ.get('AI_API_KEY') or os.environ.get('OPENAI_API_KEY')
    model = os.environ.get('AI_MODEL') or getattr(settings, 'AI_MODEL', '')
    api_url = os.environ.get('AI_API_URL') or getattr(settings, 'AI_API_URL', 'https://api.mistral.ai/v1/chat/completions')
    provider = 'mistral' if 'mistral' in api_url.lower() else 'openai-compatible'

    if not api_key:
        return None, 'AI_API_KEY is not set in the Django server environment.'
    if not model:
        return None, 'AI_MODEL is not set.'

    system_prompt = (
        "Vous ?tes l'assistant s?curis? du cabinet d'avocat A?t El Hadj. "
        f"R?pondez dans la langue demand?e: {language}. Si language='ar', r?pondez en arabe clair et naturel. "
        "Vous pouvez r?pondre aux questions g?n?rales. Lorsque la question concerne le cabinet, utilisez le contexte de base de donn?es fourni. "
        "Ne donnez jamais d'informations financi?res si le contexte finance est absent. "
        "Ne pr?tendez jamais avoir modifi? la base sans confirmation explicite. "
        "Si une action est demand?e, expliquez qu'elle n?cessite confirmation."
    )
    messages = [{'role': 'system', 'content': system_prompt}]
    for item in (history or [])[-6:]:
        role = item.get('role') if item.get('role') in ('user', 'assistant') else 'user'
        content = str(item.get('content', ''))[:1200]
        if content:
            messages.append({'role': role, 'content': content})
    messages.append({
        'role': 'user',
        'content': (
            f"Question utilisateur : {message}\n\n"
            "Contexte autoris? depuis la base de donn?es :\n"
            f"{json.dumps(context, ensure_ascii=False, default=str)}"
        )
    })

    payload = json.dumps({
        'model': model,
        'messages': messages,
        'temperature': 0.2,
    }).encode('utf-8')
    request = urllib.request.Request(
        api_url,
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data['choices'][0]['message']['content'], f'{provider}:ok'
    except urllib.error.HTTPError as error:
        detail = error.read().decode('utf-8', errors='replace')[:500]
        return None, f'{provider}:http_{error.code}:{detail}'
    except urllib.error.URLError as error:
        return None, f'{provider}:network:{error.reason}'
    except (KeyError, IndexError, json.JSONDecodeError) as error:
        return None, f'{provider}:bad_response:{error}'


def answer_message(user, message, language='fr', history=None):
    context = build_cabinet_context(user)
    actions = propose_actions(message)
    answer = local_answer(message, context, language=language)
    if actions:
        confirmation_text = (
            '????? ?????? ??????. ?? ??? ?????? ??? ??? ??????.'
            if language == 'ar'
            else 'I prepared a possible action. It will only be applied after your confirmation.'
            if language == 'en'
            else 'J?ai pr?par? une action possible. Elle ne sera appliqu?e qu?apr?s votre confirmation.'
        )
        answer = f"{answer}\n\n{confirmation_text}"
    return {
        'answer': answer,
        'mode': 'database',
        'read_only': False,
        'actions': actions,
        'sources': {
            'clients': len(context.get('clients', [])),
            'cases': len(context.get('cases', [])),
            'tasks': len(context.get('tasks', [])),
            'hearings': len(context.get('hearings', [])),
            'documents': len(context.get('documents', [])),
            'notes': len(context.get('notes', [])),
            'finance_included': 'finance' in context,
        }
    }


def execute_action(user, action_type, payload, language='fr'):
    if action_type == 'create_task':
        title = str(payload.get('title', '')).strip()
        if not title:
            raise ValidationError({'title': 'Task title is required.'})
        case = None
        case_id = payload.get('case_id')
        if case_id:
            case = Case.objects.filter(id=case_id).first()
            if not case:
                raise ValidationError({'case_id': 'Case not found.'})
        task = Task.objects.create(
            title=title[:200],
            description=str(payload.get('description', '')).strip() or None,
            priority=str(payload.get('priority', 'normal')).strip() or 'normal',
            status=Task.Status.PENDING,
            case=case,
            assigned_to=user,
        )
        return {
            'detail': f'La tâche “{task.title}” a été créée.',
            'object': {'type': 'task', 'id': task.id, 'title': task.title},
        }

    if action_type == 'add_note':
        content = str(payload.get('content', '')).strip()
        if not content:
            raise ValidationError({'content': 'Note content is required.'})
        case = None
        client = None
        if payload.get('case_id'):
            case = Case.objects.filter(id=payload.get('case_id')).first()
            if not case:
                raise ValidationError({'case_id': 'Case not found.'})
        if payload.get('client_id'):
            client = Client.objects.filter(id=payload.get('client_id')).first()
            if not client:
                raise ValidationError({'client_id': 'Client not found.'})
        note = Note.objects.create(
            title=str(payload.get('title', 'Note chatbot')).strip()[:200] or 'Note chatbot',
            content=content,
            case=case,
            client=client,
            author=user,
        )
        return {
            'detail': 'La note a été ajoutée.',
            'object': {'type': 'note', 'id': note.id, 'title': note.title},
        }

    if action_type == 'update_task_status':
        task = Task.objects.filter(id=payload.get('task_id')).first()
        if not task:
            raise ValidationError({'task_id': 'Task not found.'})
        status = payload.get('status')
        valid_statuses = [choice[0] for choice in Task.Status.choices]
        if status not in valid_statuses:
            raise ValidationError({'status': 'Invalid task status.'})
        task.status = status
        if status == Task.Status.COMPLETED:
            task.completed_at = timezone.now()
            task.is_archived = False
            task.archived_at = None
        else:
            task.completed_at = None
            task.is_archived = False
            task.archived_at = None
        task.save(update_fields=['status', 'completed_at', 'is_archived', 'archived_at'])
        return {
            'detail': f'Le statut de la tâche “{task.title}” a été mis à jour.',
            'object': {'type': 'task', 'id': task.id, 'status': task.status},
        }

    if action_type == 'update_case_status':
        case = Case.objects.filter(id=payload.get('case_id')).first()
        if not case:
            raise ValidationError({'case_id': 'Case not found.'})
        status = payload.get('status')
        valid_statuses = [choice[0] for choice in Case.Status.choices]
        if status not in valid_statuses:
            raise ValidationError({'status': 'Invalid case status.'})
        case.status = status
        case.save(update_fields=['status'])
        return {
            'detail': f'Le statut du dossier “{case.case_number or case.title}” a été mis à jour.',
            'object': {'type': 'case', 'id': case.id, 'status': case.status},
        }

    raise ValidationError({'type': 'Unsupported chatbot action.'})
