import asyncio
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from api.routes.admin import (
    CreateManagedUserRequest,
    CreateUserInvitationRequest,
    ResetUserPasswordRequest,
    UpdateUserAccessRequest,
    admin_create_user,
    admin_delete_user,
    admin_invite_user,
    admin_reset_user_password,
    admin_update_user,
    get_admin_users,
)
from core.auth import CurrentUser, get_current_admin, get_current_user
from services.clerk_users import (
    ManagedUserProfile,
    PendingInvitationItem,
    _ensure_initial_admin_bootstrapped,
    _parse_managed_user,
    clear_user_access_cache,
)


class AdminAuthTests(unittest.TestCase):
    def setUp(self) -> None:
        clear_user_access_cache()

    def test_unapproved_user_is_blocked_with_403(self) -> None:
        unapproved = ManagedUserProfile(
            clerk_user_id="user_unapproved",
            email="visitor@example.com",
            full_name="Visitor",
            role="user",
            approved=False,
            suspended=False,
            status="pending",
        )
        with patch("core.auth.get_user_access_profile", return_value=unapproved):
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(get_current_user("user_unapproved"))

        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["code"], "ACCOUNT_NOT_APPROVED")

    def test_suspended_user_is_blocked_with_403(self) -> None:
        suspended = ManagedUserProfile(
            clerk_user_id="user_suspended",
            email="suspended@example.com",
            full_name="Suspended User",
            role="user",
            approved=True,
            suspended=True,
            status="suspended",
        )
        with patch("core.auth.get_user_access_profile", return_value=suspended):
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(get_current_user("user_suspended"))

        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["code"], "ACCOUNT_SUSPENDED")

    def test_approved_user_passes_get_current_user_but_fails_admin_guard(self) -> None:
        approved_user = ManagedUserProfile(
            clerk_user_id="user_regular",
            email="student@example.com",
            full_name="Student",
            role="user",
            approved=True,
            suspended=False,
            status="active",
        )
        with patch("core.auth.get_user_access_profile", return_value=approved_user):
            current = asyncio.run(get_current_user("user_regular"))

        self.assertEqual(current.clerk_user_id, "user_regular")
        self.assertEqual(current.role, "user")
        self.assertFalse(current.is_admin)

        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(get_current_admin(current))
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["code"], "ADMIN_REQUIRED")

    def test_admin_user_passes_admin_guard(self) -> None:
        admin_user = CurrentUser(
            clerk_user_id="user_admin",
            email="admin@example.com",
            role="admin",
            is_admin=True,
        )
        verified = asyncio.run(get_current_admin(admin_user))
        self.assertEqual(verified.clerk_user_id, "user_admin")
        self.assertTrue(verified.is_admin)

    def test_self_lockout_protection_blocks_admin_from_demoting_or_deleting_self(self) -> None:
        admin_user = CurrentUser(
            clerk_user_id="user_admin",
            email="admin@example.com",
            role="admin",
            is_admin=True,
        )

        with self.assertRaises(HTTPException) as demote_ctx:
            admin_update_user(
                "user_admin",
                UpdateUserAccessRequest(role="user"),
                current_admin=admin_user,
            )
        self.assertEqual(demote_ctx.exception.status_code, 400)

        with self.assertRaises(HTTPException) as suspend_ctx:
            admin_update_user(
                "user_admin",
                UpdateUserAccessRequest(suspended=True),
                current_admin=admin_user,
            )
        self.assertEqual(suspend_ctx.exception.status_code, 400)

        with self.assertRaises(HTTPException) as revoke_ctx:
            admin_update_user(
                "user_admin",
                UpdateUserAccessRequest(approved=False),
                current_admin=admin_user,
            )
        self.assertEqual(revoke_ctx.exception.status_code, 400)

        with self.assertRaises(HTTPException) as delete_ctx:
            admin_delete_user("user_admin", current_admin=admin_user)
        self.assertEqual(delete_ctx.exception.status_code, 400)

    def test_admin_user_crud_and_invitation_endpoints(self) -> None:
        admin_user = CurrentUser(
            clerk_user_id="user_admin",
            email="admin@example.com",
            role="admin",
            is_admin=True,
        )
        sample_users = [
            ManagedUserProfile(
                clerk_user_id="user_admin",
                email="admin@example.com",
                full_name="Admin",
                role="admin",
                approved=True,
                suspended=False,
                status="active",
            ),
            ManagedUserProfile(
                clerk_user_id="user_pending",
                email="waitlist@example.com",
                full_name="Waitlist",
                role="user",
                approved=False,
                suspended=False,
                status="pending",
            ),
        ]
        sample_invites = [
            PendingInvitationItem(
                id="inv_1",
                email_address="invited@example.com",
                role="user",
                status="pending",
            )
        ]

        with (
            patch("api.routes.admin.list_managed_users", return_value=sample_users),
            patch("api.routes.admin.list_pending_invitations", return_value=sample_invites),
        ):
            overview = get_admin_users(_admin=admin_user)

        self.assertEqual(overview.counts.total_users, 2)
        self.assertEqual(overview.counts.active_users, 1)
        self.assertEqual(overview.counts.pending_users, 1)
        self.assertEqual(overview.counts.admin_users, 1)
        self.assertEqual(overview.counts.pending_invitations, 1)

        created_profile = ManagedUserProfile(
            clerk_user_id="user_new",
            email="new@example.com",
            full_name="New User",
            role="user",
            approved=True,
            suspended=False,
            status="active",
        )
        with patch("api.routes.admin.create_managed_user", return_value=created_profile) as mock_create:
            result = admin_create_user(
                CreateManagedUserRequest(
                    email="New@Example.com",
                    password="StrongPassword123!",
                    first_name="New",
                    last_name="User",
                    role="user",
                ),
                current_admin=admin_user,
            )
            self.assertEqual(result.email, "new@example.com")
            mock_create.assert_called_once()

        with patch("api.routes.admin.create_user_invitation", return_value=sample_invites[0]) as mock_invite:
            inv = admin_invite_user(
                CreateUserInvitationRequest(
                    email="invited@example.com",
                    role="user",
                ),
                current_admin=admin_user,
            )
            self.assertEqual(inv.id, "inv_1")
            mock_invite.assert_called_once()

        with patch("api.routes.admin.reset_user_password", return_value=created_profile) as mock_reset:
            admin_reset_user_password(
                "user_new",
                ResetUserPasswordRequest(new_password="UpdatedPassword123!"),
                _admin=admin_user,
            )
            mock_reset.assert_called_once_with("user_new", "UpdatedPassword123!")

    def test_first_admin_bootstrap_promotes_earliest_user_when_none_exist(self) -> None:
        import services.clerk_users as clerk_users_mod

        clerk_users_mod._bootstrap_checked = False
        raw_users = [
            {
                "id": "user_owner_earliest",
                "first_name": "Cris",
                "last_name": "Owner",
                "primary_email_address_id": "idn_1",
                "email_addresses": [{"id": "idn_1", "email_address": "owner@studflow.dev"}],
                "public_metadata": {},
                "created_at": 1700000000000,
            }
        ]
        calls: list[tuple[str, str]] = []

        def fake_request(method: str, path: str, **kwargs):
            calls.append((method, path))
            if method == "GET" and path == "/users":
                return raw_users
            if method == "PATCH" and path == "/users/user_owner_earliest/metadata":
                return {
                    **raw_users[0],
                    "public_metadata": {
                        "approved": True,
                        "role": "admin",
                        "suspended": False,
                    },
                }
            return {}

        with patch("services.clerk_users._clerk_request", side_effect=fake_request):
            _ensure_initial_admin_bootstrapped()

        self.assertIn(("PATCH", "/users/user_owner_earliest/metadata"), calls)
        self.assertIn(("POST", "/allowlist_identifiers"), calls)
        self.assertIn(("PATCH", "/instance/restrictions"), calls)

        parsed = _parse_managed_user(
            {
                **raw_users[0],
                "public_metadata": {"approved": True, "role": "admin", "suspended": False},
            }
        )
        self.assertEqual(parsed.role, "admin")
        self.assertTrue(parsed.approved)
        self.assertEqual(parsed.status, "active")


if __name__ == "__main__":
    unittest.main()
