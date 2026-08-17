from .models import DocumentAuditLog


def document_cabinet(document):
    if document.case_id:
        return document.case.client.cabinet
    if document.client_id:
        return document.client.cabinet
    return document.uploaded_by.cabinet if document.uploaded_by else None


def document_snapshot(document):
    return {
        'id': document.pk,
        'title': document.title,
        'description': document.description,
        'original_filename': document.original_filename,
        'mime_type': document.mime_type,
        'size': document.size,
        'sha256': document.sha256,
        'client_id': document.client_id,
        'case_id': document.case_id,
        'uploaded_by_id': document.uploaded_by_id,
    }


def request_audit_metadata(request):
    if request is None:
        return {'ip_address': None, 'user_agent': ''}
    return {
        'ip_address': request.META.get('REMOTE_ADDR') or None,
        'user_agent': (request.META.get('HTTP_USER_AGENT') or '')[:512],
    }


def audit_document_action(
    document,
    action,
    actor,
    *,
    request=None,
    before=None,
    after=None,
):
    cabinet = document_cabinet(document)
    if cabinet is None:
        raise ValueError('Cannot audit a document without a cabinet scope.')
    return DocumentAuditLog.objects.create(
        cabinet=cabinet,
        actor=actor,
        client=document.client,
        case=document.case,
        document_id=document.pk,
        action=action,
        original_filename=document.original_filename,
        mime_type=document.mime_type,
        size=document.size,
        sha256=document.sha256,
        before=before if before is not None else {},
        after=after if after is not None else {},
        **request_audit_metadata(request),
    )
