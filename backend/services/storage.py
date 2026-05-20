from __future__ import annotations

import mimetypes
from pathlib import PurePosixPath
from urllib.parse import urlparse

from supabase import Client, create_client

from core.config import settings


class StorageServiceError(Exception):
    """Raised when storage operations fail."""


def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_key:
        raise StorageServiceError(
            "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_KEY."
        )

    return create_client(settings.supabase_url, settings.supabase_key)


def build_storage_path(document_id: str, filename: str) -> str:
    sanitized_name = PurePosixPath(filename).name.replace(" ", "-")
    return f"{settings.supabase_storage_folder}/{document_id}/{sanitized_name}"


def upload_file_to_storage(
    *,
    content: bytes,
    destination_path: str,
    content_type: str | None,
) -> str:
    client = get_supabase_client()
    resolved_content_type, _ = mimetypes.guess_type(destination_path)
    upload_content_type = content_type or resolved_content_type or "application/octet-stream"

    try:
        client.storage.from_(settings.supabase_storage_bucket).upload(
            path=destination_path,
            file=content,
            file_options={
                "content-type": upload_content_type,
                "upsert": "false",
            },
        )
        public_url = client.storage.from_(settings.supabase_storage_bucket).get_public_url(
            destination_path
        )
    except Exception as exc:  # pragma: no cover - third-party client errors vary
        raise StorageServiceError("Failed to upload file to Supabase Storage.") from exc

    if not public_url:
        raise StorageServiceError("Supabase Storage did not return a public URL.")

    return public_url


def extract_storage_path(file_url: str) -> str:
    parsed_url = urlparse(file_url)
    marker = f"/storage/v1/object/public/{settings.supabase_storage_bucket}/"

    if marker not in parsed_url.path:
        raise StorageServiceError(
            "File URL does not match the configured Supabase public storage path."
        )

    return parsed_url.path.split(marker, maxsplit=1)[1]


def download_file_from_storage(file_url: str) -> bytes:
    client = get_supabase_client()
    storage_path = extract_storage_path(file_url)

    try:
        file_bytes = client.storage.from_(settings.supabase_storage_bucket).download(
            storage_path
        )
    except Exception as exc:  # pragma: no cover - third-party client errors vary
        raise StorageServiceError("Failed to download file from Supabase Storage.") from exc

    if not isinstance(file_bytes, bytes):
        raise StorageServiceError("Supabase Storage returned an unexpected payload.")

    return file_bytes


def delete_file_from_storage(file_url: str) -> None:
    client = get_supabase_client()
    storage_path = extract_storage_path(file_url)

    try:
        client.storage.from_(settings.supabase_storage_bucket).remove([storage_path])
    except Exception as exc:  # pragma: no cover - third-party client errors vary
        raise StorageServiceError("Failed to delete file from Supabase Storage.") from exc
