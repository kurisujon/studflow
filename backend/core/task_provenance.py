from __future__ import annotations

import hashlib
import hmac
import json
import re
from collections.abc import Mapping, Sequence
from typing import Any

from core.config import settings


HEADER_VERSION = "studflow-provenance-version"
HEADER_TENANT = "studflow-tenant-id"
HEADER_SIGNATURE = "studflow-provenance-signature"
PROVENANCE_VERSION = "1"
_DOMAIN = b"studflow-celery-provenance:v1\n"
_TENANT_PATTERN = re.compile(r"^[A-Za-z0-9_+.-]{1,255}$")
_HEADER_KEYS = frozenset({HEADER_VERSION, HEADER_TENANT, HEADER_SIGNATURE})


class TaskProvenanceError(ValueError):
    """Raised before database access when task tenant provenance is invalid."""


def _payload(operation: str, tenant_id: str, arguments: Sequence[object]) -> bytes:
    if not operation or not _TENANT_PATTERN.fullmatch(tenant_id):
        raise TaskProvenanceError("Task provenance identity is invalid.")
    canonical = json.dumps(
        {
            "arguments": [str(argument) for argument in arguments],
            "operation": operation,
            "tenant_id": tenant_id,
            "version": PROVENANCE_VERSION,
        },
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
    ).encode("ascii")
    return _DOMAIN + canonical


def build_task_headers(
    operation: str,
    tenant_id: str,
    arguments: Sequence[object],
) -> dict[str, str]:
    signature = hmac.new(
        settings.secret_key.encode("utf-8"),
        _payload(operation, tenant_id, arguments),
        hashlib.sha256,
    ).hexdigest()
    return {
        HEADER_VERSION: PROVENANCE_VERSION,
        HEADER_TENANT: tenant_id,
        HEADER_SIGNATURE: signature,
    }


def verify_task_headers(
    headers: Mapping[str, Any] | None,
    operation: str,
    arguments: Sequence[object],
) -> str:
    if not isinstance(headers, Mapping):
        raise TaskProvenanceError("Task provenance is required.")
    if set(headers) != _HEADER_KEYS:
        raise TaskProvenanceError("Task provenance fields are invalid.")
    version = headers.get(HEADER_VERSION)
    tenant_id = headers.get(HEADER_TENANT)
    supplied_signature = headers.get(HEADER_SIGNATURE)
    if version != PROVENANCE_VERSION:
        raise TaskProvenanceError("Task provenance version is unsupported.")
    if not isinstance(tenant_id, str) or not isinstance(supplied_signature, str):
        raise TaskProvenanceError("Task provenance is incomplete.")
    expected = build_task_headers(operation, tenant_id, arguments)[HEADER_SIGNATURE]
    if not hmac.compare_digest(supplied_signature, expected):
        raise TaskProvenanceError("Task provenance signature is invalid.")
    return tenant_id


def retry_headers(headers: Mapping[str, Any] | None) -> dict[str, str]:
    """Copy only authenticated provenance fields into a Celery retry."""
    if not isinstance(headers, Mapping):
        raise TaskProvenanceError("Task provenance is required.")
    if set(headers) != _HEADER_KEYS:
        raise TaskProvenanceError("Task provenance fields are invalid.")
    return {
        key: str(headers[key])
        for key in (HEADER_VERSION, HEADER_TENANT, HEADER_SIGNATURE)
        if key in headers
    }
