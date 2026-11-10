from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from threading import RLock
from typing import Any, Literal

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel

from core.config import settings

logger = logging.getLogger(__name__)

CLERK_API_BASE_URL = "https://api.clerk.com/v1"
_CACHE_TTL_SECONDS = 30.0

UserRole = Literal["admin", "user"]
UserAccessStatus = Literal["active", "pending", "suspended"]


class ManagedUserProfile(BaseModel):
    clerk_user_id: str
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    full_name: str
    image_url: str | None = None
    role: UserRole = "user"
    approved: bool = False
    suspended: bool = False
    status: UserAccessStatus = "pending"
    created_at: datetime | None = None
    last_sign_in_at: datetime | None = None


class PendingInvitationItem(BaseModel):
    id: str
    email_address: str
    role: UserRole = "user"
    status: str = "pending"
    created_at: datetime | None = None
    expires_at: datetime | None = None


class AllowlistEntry(BaseModel):
    id: str
    identifier: str
    created_at: datetime | None = None


_cache_lock = RLock()
_user_profile_cache: dict[str, tuple[float, ManagedUserProfile]] = {}
_bootstrap_checked: bool = False


def clear_user_access_cache(clerk_user_id: str | None = None) -> None:
    """Invalidate cached access profiles (all or a single user)."""
    with _cache_lock:
        if clerk_user_id:
            _user_profile_cache.pop(clerk_user_id, None)
        else:
            _user_profile_cache.clear()


def _require_clerk_secret_key() -> str:
    secret_key = settings.clerk_secret_key.strip()
    if not secret_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="CLERK_SECRET_KEY is not configured on the backend.",
        )
    return secret_key


def _clerk_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_require_clerk_secret_key()}",
        "Content-Type": "application/json",
    }


def _extract_clerk_error_message(response: httpx.Response, fallback: str) -> str:
    try:
        payload = response.json()
        errors = payload.get("errors")
        if isinstance(errors, list) and errors:
            first = errors[0]
            if isinstance(first, dict):
                return (
                    str(first.get("long_message") or first.get("message") or fallback)
                )
    except Exception:
        pass
    return fallback


def _clerk_request(
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    json_body: dict[str, Any] | None = None,
    fallback_error: str = "Clerk API request failed.",
) -> Any:
    url = f"{CLERK_API_BASE_URL}{path}"
    try:
        response = httpx.request(
            method=method,
            url=url,
            headers=_clerk_headers(),
            params=params,
            json=json_body,
            timeout=10.0,
        )
    except httpx.RequestError as exc:
        logger.error("Clerk API network error (%s %s): %s", method, path, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach authentication provider.",
        ) from exc

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_extract_clerk_error_message(response, "Resource not found in Clerk."),
        )

    if response.status_code in (400, 422):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_extract_clerk_error_message(response, fallback_error),
        )

    if response.status_code >= 400:
        logger.error(
            "Clerk API error (%s %s -> %s): %s",
            method,
            path,
            response.status_code,
            response.text,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_extract_clerk_error_message(response, fallback_error),
        )

    if response.status_code == 204 or not response.content:
        return {}
    return response.json()


def _ms_to_datetime(timestamp_ms: Any) -> datetime | None:
    if isinstance(timestamp_ms, (int, float)) and timestamp_ms > 0:
        return datetime.fromtimestamp(timestamp_ms / 1000.0, tz=timezone.utc)
    return None


def _extract_primary_email(raw_user: dict[str, Any]) -> str | None:
    email_addresses = raw_user.get("email_addresses")
    if not isinstance(email_addresses, list) or not email_addresses:
        return None

    primary_id = raw_user.get("primary_email_address_id")
    if primary_id:
        for item in email_addresses:
            if isinstance(item, dict) and item.get("id") == primary_id:
                addr = item.get("email_address")
                if isinstance(addr, str) and addr.strip():
                    return addr.strip()

    first = email_addresses[0]
    if isinstance(first, dict):
        addr = first.get("email_address")
        if isinstance(addr, str) and addr.strip():
            return addr.strip()
    return None


def _get_configured_admin_emails() -> set[str]:
    raw = os.getenv("ADMIN_EMAILS", "")
    if not raw:
        return set()
    return {email.strip().lower() for email in raw.split(",") if email.strip()}


def _get_configured_admin_user_ids() -> set[str]:
    raw = os.getenv("ADMIN_CLERK_USER_IDS", "")
    if not raw:
        return set()
    return {uid.strip() for uid in raw.split(",") if uid.strip()}


def _is_configured_admin(clerk_user_id: str, email: str | None) -> bool:
    if clerk_user_id in _get_configured_admin_user_ids():
        return True
    if email and email.lower() in _get_configured_admin_emails():
        return True
    return False


def _parse_managed_user(raw_user: dict[str, Any]) -> ManagedUserProfile:
    clerk_user_id = str(raw_user.get("id") or "").strip()
    email = _extract_primary_email(raw_user)
    first_name = (raw_user.get("first_name") or "").strip() or None
    last_name = (raw_user.get("last_name") or "").strip() or None
    full_name = " ".join(part for part in (first_name, last_name) if part).strip()
    if not full_name:
        full_name = email or clerk_user_id

    public_meta = raw_user.get("public_metadata")
    if not isinstance(public_meta, dict):
        public_meta = {}

    if _is_configured_admin(clerk_user_id, email):
        role: UserRole = "admin"
        approved = True
        suspended = False
    else:
        raw_role = str(public_meta.get("role") or "user").strip().lower()
        role = "admin" if raw_role == "admin" else "user"
        suspended = (
            bool(public_meta.get("suspended", False))
            or bool(raw_user.get("banned", False))
            or bool(raw_user.get("locked", False))
        )
        approved = bool(public_meta.get("approved", False)) or (role == "admin")

    if suspended:
        access_status: UserAccessStatus = "suspended"
    elif approved:
        access_status = "active"
    else:
        access_status = "pending"

    return ManagedUserProfile(
        clerk_user_id=clerk_user_id,
        email=email,
        first_name=first_name,
        last_name=last_name,
        full_name=full_name,
        image_url=raw_user.get("image_url"),
        role=role,
        approved=approved,
        suspended=suspended,
        status=access_status,
        created_at=_ms_to_datetime(raw_user.get("created_at")),
        last_sign_in_at=_ms_to_datetime(raw_user.get("last_sign_in_at")),
    )


# ---------------------------------------------------------------------------
# Option B: Clerk Allowlist & Instance Restrictions API
# ---------------------------------------------------------------------------


def list_allowlist_entries() -> list[AllowlistEntry]:
    """Retrieve all allowlisted email/identifier entries from Clerk."""
    raw = _clerk_request(
        "GET",
        "/allowlist_identifiers",
        fallback_error="Failed to fetch Clerk allowlist identifiers.",
    )
    items_list = raw.get("data") if isinstance(raw, dict) else raw
    if not isinstance(items_list, list):
        return []

    entries: list[AllowlistEntry] = []
    for item in items_list:
        if not isinstance(item, dict):
            continue
        identifier = str(item.get("identifier") or "").strip().lower()
        entry_id = str(item.get("id") or "").strip()
        if identifier and entry_id:
            entries.append(
                AllowlistEntry(
                    id=entry_id,
                    identifier=identifier,
                    created_at=_ms_to_datetime(item.get("created_at")),
                )
            )
    return entries


def add_email_to_allowlist(
    email: str | None, *, notify: bool = False
) -> AllowlistEntry | None:
    """Ensure an email address is present on Clerk's instance allowlist so Google OAuth
    and invitation sign-ins are permitted by Clerk."""
    if not email or not email.strip():
        return None
    normalized = email.strip().lower()

    try:
        existing = list_allowlist_entries()
        for entry in existing:
            if entry.identifier.lower() == normalized:
                return entry

        raw = _clerk_request(
            "POST",
            "/allowlist_identifiers",
            json_body={"identifier": normalized, "notify": notify},
            fallback_error="Failed to add email to Clerk allowlist.",
        )
        if isinstance(raw, dict) and raw.get("id"):
            return AllowlistEntry(
                id=str(raw.get("id")),
                identifier=str(raw.get("identifier") or normalized).lower(),
                created_at=_ms_to_datetime(raw.get("created_at")),
            )
    except Exception as exc:
        logger.warning("Unable to sync email %s to Clerk allowlist: %s", normalized, exc)
    return None


def remove_email_from_allowlist(email: str | None) -> None:
    """Remove an email address from Clerk's allowlist when a user is suspended or deleted."""
    if not email or not email.strip():
        return
    normalized = email.strip().lower()
    try:
        existing = list_allowlist_entries()
        for entry in existing:
            if entry.identifier.lower() == normalized:
                _clerk_request(
                    "DELETE",
                    f"/allowlist_identifiers/{entry.id}",
                    fallback_error="Failed to remove email from Clerk allowlist.",
                )
    except Exception as exc:
        logger.warning(
            "Unable to remove email %s from Clerk allowlist: %s", normalized, exc
        )


def enable_clerk_allowlist_restriction() -> None:
    """Configure the Clerk instance so sign-ups (including 'Continue with Google' for
    new accounts) are restricted strictly to allowlisted/invited emails."""
    try:
        _clerk_request(
            "PATCH",
            "/instance/restrictions",
            json_body={
                "allowlist": True,
                "restricted_to_allowlist": True,
            },
            fallback_error="Failed to enable Clerk allowlist restriction.",
        )
    except Exception as exc:
        logger.warning("Unable to update Clerk instance restrictions: %s", exc)


def _ensure_initial_admin_bootstrapped() -> None:
    """Ensure at least one admin exists in Clerk by promoting the earliest account if none exist,
    sync approved emails to Clerk's allowlist, and enable Clerk's allowlist restriction."""
    global _bootstrap_checked
    with _cache_lock:
        if _bootstrap_checked:
            return

    raw_users = _clerk_request(
        "GET",
        "/users",
        params={"limit": 100, "order_by": "+created_at"},
        fallback_error="Failed to list users for admin bootstrap.",
    )
    if not isinstance(raw_users, list) or not raw_users:
        with _cache_lock:
            _bootstrap_checked = True
        return

    parsed_users = [_parse_managed_user(u) for u in raw_users if isinstance(u, dict)]
    has_any_admin = any(
        u.role == "admin" and u.approved and not u.suspended for u in parsed_users
    )

    if not has_any_admin and parsed_users:
        owner = parsed_users[0]
        logger.info(
            "Bootstrapping initial admin account for earliest Clerk user: %s (%s)",
            owner.clerk_user_id,
            owner.email,
        )
        raw_updated = _clerk_request(
            "PATCH",
            f"/users/{owner.clerk_user_id}/metadata",
            json_body={
                "public_metadata": {
                    "approved": True,
                    "role": "admin",
                    "suspended": False,
                    "bootstrapped_admin": True,
                }
            },
            fallback_error="Failed to bootstrap initial admin account.",
        )
        if isinstance(raw_updated, dict):
            parsed_users[0] = _parse_managed_user(raw_updated)
        clear_user_access_cache(owner.clerk_user_id)

    # Sync all approved & active users' emails to Clerk's Allowlist before enabling restriction
    for user_profile in parsed_users:
        if user_profile.approved and not user_profile.suspended and user_profile.email:
            add_email_to_allowlist(user_profile.email, notify=False)

    for configured_email in _get_configured_admin_emails():
        add_email_to_allowlist(configured_email, notify=False)

    enable_clerk_allowlist_restriction()

    with _cache_lock:
        _bootstrap_checked = True


def _try_consume_matching_invitation_or_allowlist(
    profile: ManagedUserProfile,
) -> ManagedUserProfile:
    """If an unapproved user signed in (e.g. via Google OAuth) and has a pending email
    invitation or is on the Clerk Allowlist, automatically approve them."""
    if profile.approved or profile.suspended or not profile.email:
        return profile

    target_email = profile.email.strip().lower()

    # 1. Check pending invitations (preserves invited role: admin or user)
    try:
        invitations = list_pending_invitations()
        matching_invite = next(
            (
                inv
                for inv in invitations
                if inv.email_address.strip().lower() == target_email
            ),
            None,
        )
        if matching_invite:
            updated = update_user_access(
                profile.clerk_user_id,
                approved=True,
                suspended=False,
                role=matching_invite.role,
            )
            try:
                revoke_invitation(matching_invite.id)
            except Exception:
                pass
            return updated
    except Exception:
        pass

    # 2. Check Clerk Allowlist entries
    try:
        allowlist = list_allowlist_entries()
        if any(entry.identifier.lower() == target_email for entry in allowlist):
            return update_user_access(
                profile.clerk_user_id,
                approved=True,
                suspended=False,
                role=profile.role,
            )
    except Exception:
        pass

    return profile


def get_user_access_profile(
    clerk_user_id: str, *, use_cache: bool = True
) -> ManagedUserProfile:
    """Fetch and evaluate a user's access profile from Clerk with short-TTL caching."""
    now = time.monotonic()
    if use_cache:
        with _cache_lock:
            cached = _user_profile_cache.get(clerk_user_id)
            if cached and (now - cached[0]) < _CACHE_TTL_SECONDS:
                return cached[1]

    _ensure_initial_admin_bootstrapped()

    raw_user = _clerk_request(
        "GET",
        f"/users/{clerk_user_id}",
        fallback_error="Failed to fetch user profile from Clerk.",
    )
    profile = _parse_managed_user(raw_user)

    if not profile.approved and not profile.suspended:
        profile = _try_consume_matching_invitation_or_allowlist(profile)

    with _cache_lock:
        _user_profile_cache[clerk_user_id] = (time.monotonic(), profile)

    return profile


def list_managed_users() -> list[ManagedUserProfile]:
    """List all Clerk users with their resolved StudFlow access status and role."""
    _ensure_initial_admin_bootstrapped()
    raw_users = _clerk_request(
        "GET",
        "/users",
        params={"limit": 100, "order_by": "-created_at"},
        fallback_error="Failed to fetch users from Clerk.",
    )
    if not isinstance(raw_users, list):
        return []

    profiles = [_parse_managed_user(u) for u in raw_users if isinstance(u, dict)]
    now = time.monotonic()
    with _cache_lock:
        for profile in profiles:
            _user_profile_cache[profile.clerk_user_id] = (now, profile)
    return profiles


def create_managed_user(
    *,
    email: str,
    password: str,
    first_name: str | None = None,
    last_name: str | None = None,
    role: UserRole = "user",
    created_by: str | None = None,
) -> ManagedUserProfile:
    """Directly create an approved user in Clerk with email and password, and add their
    email to the Clerk Allowlist so Google Sign-In also works seamlessly."""
    normalized_email = email.strip().lower()
    add_email_to_allowlist(normalized_email, notify=False)

    payload: dict[str, Any] = {
        "email_address": [normalized_email],
        "password": password,
        "public_metadata": {
            "approved": True,
            "role": role,
            "suspended": False,
            "provisioned_by": created_by,
        },
    }
    if first_name and first_name.strip():
        payload["first_name"] = first_name.strip()
    if last_name and last_name.strip():
        payload["last_name"] = last_name.strip()

    raw_user = _clerk_request(
        "POST",
        "/users",
        json_body=payload,
        fallback_error="Failed to create user account in Clerk.",
    )
    profile = _parse_managed_user(raw_user)
    with _cache_lock:
        _user_profile_cache[profile.clerk_user_id] = (time.monotonic(), profile)
    return profile


def update_user_access(
    clerk_user_id: str,
    *,
    approved: bool | None = None,
    suspended: bool | None = None,
    role: UserRole | None = None,
) -> ManagedUserProfile:
    """Update a user's approval, suspension, or role in Clerk public_metadata and sync
    their email with Clerk's Allowlist."""
    current = get_user_access_profile(clerk_user_id, use_cache=False)

    next_approved = current.approved if approved is None else approved
    next_suspended = current.suspended if suspended is None else suspended
    next_role: UserRole = current.role if role is None else role

    metadata_patch: dict[str, Any] = {
        "approved": next_approved,
        "suspended": next_suspended,
        "role": next_role,
    }

    raw_user = _clerk_request(
        "PATCH",
        f"/users/{clerk_user_id}/metadata",
        json_body={"public_metadata": metadata_patch},
        fallback_error="Failed to update user access metadata.",
    )
    profile = _parse_managed_user(raw_user)

    if profile.email:
        if profile.approved and not profile.suspended:
            add_email_to_allowlist(profile.email, notify=False)
        else:
            remove_email_from_allowlist(profile.email)

    with _cache_lock:
        _user_profile_cache[clerk_user_id] = (time.monotonic(), profile)
    return profile


def reset_user_password(clerk_user_id: str, new_password: str) -> ManagedUserProfile:
    """Reset a user's password in Clerk and sign out existing sessions."""
    raw_user = _clerk_request(
        "PATCH",
        f"/users/{clerk_user_id}",
        json_body={
            "password": new_password,
            "sign_out_of_other_sessions": True,
        },
        fallback_error="Failed to reset user password.",
    )
    profile = _parse_managed_user(raw_user)
    with _cache_lock:
        _user_profile_cache[clerk_user_id] = (time.monotonic(), profile)
    return profile


def delete_managed_user(clerk_user_id: str) -> None:
    """Delete a user from Clerk, remove their email from the allowlist, and clear cache."""
    try:
        current = get_user_access_profile(clerk_user_id, use_cache=True)
        if current.email:
            remove_email_from_allowlist(current.email)
    except Exception:
        pass

    _clerk_request(
        "DELETE",
        f"/users/{clerk_user_id}",
        fallback_error="Failed to delete user from Clerk.",
    )
    clear_user_access_cache(clerk_user_id)


def list_pending_invitations() -> list[PendingInvitationItem]:
    """List pending email invitations in Clerk."""
    raw_invitations = _clerk_request(
        "GET",
        "/invitations",
        params={"status": "pending", "limit": 100},
        fallback_error="Failed to list pending invitations.",
    )
    if not isinstance(raw_invitations, list):
        return []

    items: list[PendingInvitationItem] = []
    for raw in raw_invitations:
        if not isinstance(raw, dict):
            continue
        meta = raw.get("public_metadata")
        if not isinstance(meta, dict):
            meta = {}
        raw_role = str(meta.get("role") or "user").strip().lower()
        role: UserRole = "admin" if raw_role == "admin" else "user"
        items.append(
            PendingInvitationItem(
                id=str(raw.get("id") or ""),
                email_address=str(raw.get("email_address") or ""),
                role=role,
                status=str(raw.get("status") or "pending"),
                created_at=_ms_to_datetime(raw.get("created_at")),
                expires_at=_ms_to_datetime(raw.get("expires_at")),
            )
        )
    return items


def create_user_invitation(
    *,
    email: str,
    role: UserRole = "user",
    redirect_url: str | None = None,
    invited_by: str | None = None,
) -> PendingInvitationItem:
    """Add the email to Clerk's Allowlist (so 'Continue with Google' works immediately)
    and send a Clerk email invitation that pre-approves the user upon acceptance."""
    normalized_email = email.strip().lower()
    add_email_to_allowlist(normalized_email, notify=False)

    payload: dict[str, Any] = {
        "email_address": normalized_email,
        "public_metadata": {
            "approved": True,
            "role": role,
            "suspended": False,
            "invited_by": invited_by,
        },
        "notify": True,
        "ignore_existing": False,
    }
    if redirect_url:
        payload["redirect_url"] = redirect_url

    raw = _clerk_request(
        "POST",
        "/invitations",
        json_body=payload,
        fallback_error="Failed to send email invitation via Clerk.",
    )
    meta = raw.get("public_metadata") if isinstance(raw, dict) else {}
    if not isinstance(meta, dict):
        meta = {}
    raw_role = str(meta.get("role") or role).strip().lower()
    resolved_role: UserRole = "admin" if raw_role == "admin" else "user"
    return PendingInvitationItem(
        id=str(raw.get("id") or ""),
        email_address=str(raw.get("email_address") or normalized_email),
        role=resolved_role,
        status=str(raw.get("status") or "pending"),
        created_at=_ms_to_datetime(raw.get("created_at")),
        expires_at=_ms_to_datetime(raw.get("expires_at")),
    )


def revoke_invitation(invitation_id: str) -> None:
    """Revoke a pending Clerk email invitation and remove the email from the allowlist."""
    try:
        invitations = list_pending_invitations()
        target = next((inv for inv in invitations if inv.id == invitation_id), None)
        if target and target.email_address:
            remove_email_from_allowlist(target.email_address)
    except Exception:
        pass

    _clerk_request(
        "POST",
        f"/invitations/{invitation_id}/revoke",
        fallback_error="Failed to revoke invitation.",
    )
