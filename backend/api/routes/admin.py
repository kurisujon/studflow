from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from core.auth import CurrentUser, get_current_admin
from services.clerk_users import (
    ManagedUserProfile,
    PendingInvitationItem,
    create_managed_user,
    create_user_invitation,
    delete_managed_user,
    list_managed_users,
    list_pending_invitations,
    reset_user_password,
    revoke_invitation,
    update_user_access,
)

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserSummaryCounts(BaseModel):
    total_users: int
    active_users: int
    pending_users: int
    suspended_users: int
    admin_users: int
    pending_invitations: int


class AdminUsersListResponse(BaseModel):
    users: list[ManagedUserProfile]
    invitations: list[PendingInvitationItem]
    counts: AdminUserSummaryCounts


class CreateManagedUserRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    role: Literal["admin", "user"] = "user"


class CreateUserInvitationRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    role: Literal["admin", "user"] = "user"
    redirect_url: str | None = Field(default=None, max_length=512)


class UpdateUserAccessRequest(BaseModel):
    approved: bool | None = None
    suspended: bool | None = None
    role: Literal["admin", "user"] | None = None


class ResetUserPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)


@router.get("/users", response_model=AdminUsersListResponse)
def get_admin_users(
    _admin: CurrentUser = Depends(get_current_admin),
) -> AdminUsersListResponse:
    users = list_managed_users()
    try:
        invitations = list_pending_invitations()
    except Exception:
        invitations = []

    counts = AdminUserSummaryCounts(
        total_users=len(users),
        active_users=sum(1 for u in users if u.status == "active"),
        pending_users=sum(1 for u in users if u.status == "pending"),
        suspended_users=sum(1 for u in users if u.status == "suspended"),
        admin_users=sum(1 for u in users if u.role == "admin" and u.status == "active"),
        pending_invitations=len(invitations),
    )
    return AdminUsersListResponse(
        users=users,
        invitations=invitations,
        counts=counts,
    )


@router.post(
    "/users",
    response_model=ManagedUserProfile,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_user(
    payload: CreateManagedUserRequest,
    current_admin: CurrentUser = Depends(get_current_admin),
) -> ManagedUserProfile:
    email = payload.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    return create_managed_user(
        email=email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        created_by=current_admin.clerk_user_id,
    )


@router.post(
    "/invitations",
    response_model=PendingInvitationItem,
    status_code=status.HTTP_201_CREATED,
)
def admin_invite_user(
    payload: CreateUserInvitationRequest,
    current_admin: CurrentUser = Depends(get_current_admin),
) -> PendingInvitationItem:
    email = payload.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    return create_user_invitation(
        email=email,
        role=payload.role,
        redirect_url=payload.redirect_url,
        invited_by=current_admin.clerk_user_id,
    )


@router.delete(
    "/invitations/{invitation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def admin_revoke_invitation(
    invitation_id: str,
    _admin: CurrentUser = Depends(get_current_admin),
) -> Response:
    revoke_invitation(invitation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/users/{target_user_id}", response_model=ManagedUserProfile)
def admin_update_user(
    target_user_id: str,
    payload: UpdateUserAccessRequest,
    current_admin: CurrentUser = Depends(get_current_admin),
) -> ManagedUserProfile:
    if target_user_id == current_admin.clerk_user_id:
        if payload.approved is False or payload.suspended is True or payload.role == "user":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot revoke, suspend, or demote your own administrator account.",
            )

    return update_user_access(
        target_user_id,
        approved=payload.approved,
        suspended=payload.suspended,
        role=payload.role,
    )


@router.post("/users/{target_user_id}/reset-password", response_model=ManagedUserProfile)
def admin_reset_user_password(
    target_user_id: str,
    payload: ResetUserPasswordRequest,
    _admin: CurrentUser = Depends(get_current_admin),
) -> ManagedUserProfile:
    return reset_user_password(target_user_id, payload.new_password)


@router.delete(
    "/users/{target_user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def admin_delete_user(
    target_user_id: str,
    current_admin: CurrentUser = Depends(get_current_admin),
) -> Response:
    if target_user_id == current_admin.clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own administrator account.",
        )

    delete_managed_user(target_user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
