from pathlib import Path

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils.deconstruct import deconstructible


@deconstructible
class PrivateDocumentStorage(FileSystemStorage):
    """Filesystem storage intentionally incapable of producing a public URL."""

    def __init__(self):
        super().__init__(
            location='',
            base_url=None,
            file_permissions_mode=0o600,
            directory_permissions_mode=0o700,
        )

    @property
    def base_location(self):
        return str(settings.PRIVATE_DOCUMENT_ROOT)

    @property
    def location(self):
        return str(Path(self.base_location).resolve())

    @property
    def base_url(self):
        return None

    def url(self, name):
        raise ValueError('Private documents do not have public storage URLs.')


private_document_storage = PrivateDocumentStorage()
