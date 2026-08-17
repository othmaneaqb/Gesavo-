import hashlib
import io
import re
import unicodedata
import zipfile
from pathlib import PurePath

from django.conf import settings
from rest_framework import serializers


DOCUMENT_TYPES = {
    '.pdf': {
        'detected': {'application/pdf'},
        'declared': {'application/pdf'},
    },
    '.doc': {
        'detected': {'application/msword'},
        'declared': {'application/msword', 'application/vnd.ms-office'},
    },
    '.docx': {
        'detected': {'application/vnd.openxmlformats-officedocument.wordprocessingml.document'},
        'declared': {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
        },
    },
    '.xls': {
        'detected': {'application/vnd.ms-excel'},
        'declared': {'application/vnd.ms-excel', 'application/vnd.ms-office'},
    },
    '.xlsx': {
        'detected': {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
        'declared': {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
        },
    },
    '.ppt': {
        'detected': {'application/vnd.ms-powerpoint'},
        'declared': {'application/vnd.ms-powerpoint', 'application/vnd.ms-office'},
    },
    '.pptx': {
        'detected': {'application/vnd.openxmlformats-officedocument.presentationml.presentation'},
        'declared': {
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/zip',
        },
    },
    '.odt': {
        'detected': {'application/vnd.oasis.opendocument.text'},
        'declared': {'application/vnd.oasis.opendocument.text', 'application/zip'},
    },
    '.rtf': {
        'detected': {'application/rtf'},
        'declared': {'application/rtf', 'text/rtf'},
    },
    '.txt': {
        'detected': {'text/plain'},
        'declared': {'text/plain'},
    },
    '.csv': {
        'detected': {'text/csv'},
        'declared': {'text/csv', 'text/plain', 'application/vnd.ms-excel'},
    },
    '.jpg': {
        'detected': {'image/jpeg'},
        'declared': {'image/jpeg'},
    },
    '.jpeg': {
        'detected': {'image/jpeg'},
        'declared': {'image/jpeg'},
    },
    '.png': {
        'detected': {'image/png'},
        'declared': {'image/png'},
    },
}

GENERIC_MIME_TYPES = {'', 'application/octet-stream', 'binary/octet-stream'}
OLE_SIGNATURE = b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'


def sanitize_filename(filename):
    value = unicodedata.normalize('NFKC', str(filename or ''))
    value = value.replace('\\', '/').split('/')[-1]
    value = ''.join(character for character in value if character.isprintable())
    suffix = PurePath(value).suffix.lower()
    stem = value[:-len(suffix)] if suffix else value
    stem = re.sub(r'[^\w.-]+', '_', stem, flags=re.UNICODE).strip('._-') or 'document'
    if re.fullmatch(r'(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])', stem, flags=re.IGNORECASE):
        stem = f'document_{stem}'
    return f'{stem[:120]}{suffix}'


def _detect_zip_mime(content):
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            names = set(archive.namelist())
            if 'word/document.xml' in names:
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            if 'xl/workbook.xml' in names:
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            if 'ppt/presentation.xml' in names:
                return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            if 'mimetype' in names:
                mime = archive.read('mimetype').decode('ascii', errors='ignore').strip()
                if mime == 'application/vnd.oasis.opendocument.text':
                    return mime
    except (OSError, ValueError, zipfile.BadZipFile, KeyError):
        return None
    return None


def detect_document_mime(content, extension):
    if content.startswith(b'%PDF-'):
        return 'application/pdf'
    if content.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'image/png'
    if content.startswith(b'\xff\xd8\xff') and content.rstrip().endswith(b'\xff\xd9'):
        return 'image/jpeg'
    if content.startswith(OLE_SIGNATURE):
        return {
            '.doc': 'application/msword',
            '.xls': 'application/vnd.ms-excel',
            '.ppt': 'application/vnd.ms-powerpoint',
        }.get(extension)
    if content.startswith(b'PK\x03\x04'):
        return _detect_zip_mime(content)
    if extension == '.rtf' and content.lstrip().startswith(b'{\\rtf'):
        return 'application/rtf'
    if extension in {'.txt', '.csv'} and b'\x00' not in content:
        try:
            content.decode('utf-8-sig')
        except UnicodeDecodeError:
            return None
        return 'text/csv' if extension == '.csv' else 'text/plain'
    return None


def inspect_document_content(content, filename, declared_mime=''):
    safe_name = sanitize_filename(filename)
    extension = PurePath(safe_name).suffix.lower()
    policy = DOCUMENT_TYPES.get(extension)
    if policy is None:
        allowed = ', '.join(sorted(DOCUMENT_TYPES))
        raise serializers.ValidationError(
            f'File extension is not allowed. Allowed extensions: {allowed}.'
        )

    detected_mime = detect_document_mime(content, extension)
    if detected_mime not in policy['detected']:
        raise serializers.ValidationError(
            'File content does not match its extension or is not a supported document.'
        )

    declared_mime = (declared_mime or '').split(';', 1)[0].strip().lower()
    if declared_mime not in GENERIC_MIME_TYPES and declared_mime not in policy['declared']:
        raise serializers.ValidationError(
            'Browser MIME type does not match the uploaded file extension.'
        )

    return {
        'original_filename': safe_name,
        'extension': extension,
        'mime_type': detected_mime,
        'size': len(content),
        'sha256': hashlib.sha256(content).hexdigest(),
    }


def inspect_document_upload(upload):
    if upload.size > settings.DOCUMENT_MAX_UPLOAD_SIZE:
        raise serializers.ValidationError(
            f'File exceeds the {settings.DOCUMENT_MAX_UPLOAD_SIZE_MB} MB size limit.'
        )
    if upload.size <= 0:
        raise serializers.ValidationError('File is empty.')

    position = upload.tell() if hasattr(upload, 'tell') else 0
    try:
        upload.seek(0)
        content = upload.read()
    finally:
        upload.seek(position or 0)

    metadata = inspect_document_content(
        content,
        upload.name,
        getattr(upload, 'content_type', ''),
    )
    if metadata['size'] != upload.size:
        raise serializers.ValidationError('Uploaded file size changed during validation.')
    # The extension is an inspection detail used by the historical migration;
    # it is not a persisted Document model field.
    metadata.pop('extension', None)
    return metadata
