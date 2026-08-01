from __future__ import annotations

import mimetypes
from pathlib import PurePosixPath

from supabase import Client, create_client

from core.config import settings

# Default expiry for signed URLs: 5 minutes.
SIGNED_URL_EXPIRES_IN_SECONDS = 300


class StorageServiceError(Exception):
    """Raised when storage operations fail."""


def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_key:
        raise StorageServiceError(
            "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_KEY."
        )

    return create_client(settings.supabase_url, settings.supabase_key)


def build_storage_path(document_id: str, filename: str) -> str:
    """Return the relative path used to store the file inside the bucket."""
    sanitized_name = PurePosixPath(filename).name.replace(" ", "-")
    return f"{settings.supabase_storage_folder}/{document_id}/{sanitized_name}"


def upload_file_to_storage(
    *,
    content: bytes,
    destination_path: str,
    content_type: str | None,
) -> str:
    """Upload *content* to *destination_path* in the private bucket.

    Returns the storage path (not a public URL) so the caller can persist it
    and later generate short-lived signed URLs on demand.
    """
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
    except Exception as exc:  # pragma: no cover - third-party client errors vary
        raise StorageServiceError("Failed to upload file to Supabase Storage.") from exc

    # Return the storage path — NOT a public URL.
    return destination_path


def create_signed_url(
    storage_path: str,
    expires_in: int = SIGNED_URL_EXPIRES_IN_SECONDS,
) -> str:
    """Generate a short-lived signed URL for *storage_path*.

    The URL is only valid for *expires_in* seconds (default 5 minutes).
    This must be called at request-time; never cache or persist the result.
    """
    client = get_supabase_client()

    try:
        result = client.storage.from_(settings.supabase_storage_bucket).create_signed_url(
            path=storage_path,
            expires_in=expires_in,
        )
    except Exception as exc:  # pragma: no cover - third-party client errors vary
        raise StorageServiceError("Failed to generate signed URL from Supabase Storage.") from exc

    signed_url: str | None = (
        result.get("signedURL") or result.get("signedUrl") if isinstance(result, dict) else None
    )

    if not signed_url:
        raise StorageServiceError("Supabase Storage did not return a signed URL.")

    return signed_url


def download_file_from_storage(storage_path: str) -> bytes:
    """Download a file by its *storage_path* from the private bucket."""
    client = get_supabase_client()

    try:
        file_bytes = client.storage.from_(settings.supabase_storage_bucket).download(
            storage_path
        )
    except Exception as exc:  # pragma: no cover - third-party client errors vary
        raise StorageServiceError("Failed to download file from Supabase Storage.") from exc

    if not isinstance(file_bytes, bytes):
        raise StorageServiceError("Supabase Storage returned an unexpected payload.")

    return file_bytes


def delete_file_from_storage(storage_path: str) -> None:
    """Delete a file by its *storage_path* from the private bucket."""
    client = get_supabase_client()

    try:
        client.storage.from_(settings.supabase_storage_bucket).remove([storage_path])
    except Exception as exc:  # pragma: no cover - third-party client errors vary
        raise StorageServiceError("Failed to delete file from Supabase Storage.") from exc


def validate_document_storage_path(storage_path: str, document_id: str) -> str:
    """Ensure a persisted path belongs to the expected document folder."""
    path = PurePosixPath(storage_path)
    expected_parent = PurePosixPath(settings.supabase_storage_folder) / document_id
    if path.is_absolute() or ".." in path.parts or path.parent != expected_parent:
        raise StorageServiceError("Document storage path is invalid.")
    return storage_path
