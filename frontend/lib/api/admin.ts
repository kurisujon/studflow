import { API_BASE_URL, readAPIErrorDetail } from "@/lib/api";
import type {
  AdminUsersOverview,
  ManagedUser,
  PendingInvitation,
  UserRole,
} from "@/lib/types";

function buildHeaders(token?: string | null, json: boolean = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function getAdminUsersOverview(
  token?: string | null,
): Promise<AdminUsersOverview> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "GET",
    headers: buildHeaders(token),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await readAPIErrorDetail(response);
    throw new Error(detail);
  }
  return (await response.json()) as AdminUsersOverview;
}

export async function createAdminUser(
  payload: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
  },
  token?: string | null,
): Promise<ManagedUser> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await readAPIErrorDetail(response);
    throw new Error(detail);
  }
  return (await response.json()) as ManagedUser;
}

export async function createAdminInvitation(
  payload: {
    email: string;
    role: UserRole;
    redirect_url?: string;
  },
  token?: string | null,
): Promise<PendingInvitation> {
  const response = await fetch(`${API_BASE_URL}/api/admin/invitations`, {
    method: "POST",
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await readAPIErrorDetail(response);
    throw new Error(detail);
  }
  return (await response.json()) as PendingInvitation;
}

export async function revokeAdminInvitation(
  invitationId: string,
  token?: string | null,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: "DELETE",
      headers: buildHeaders(token),
    },
  );
  if (!response.ok) {
    const detail = await readAPIErrorDetail(response);
    throw new Error(detail);
  }
}

export async function updateAdminUserAccess(
  userId: string,
  payload: {
    approved?: boolean;
    suspended?: boolean;
    role?: UserRole;
  },
  token?: string | null,
): Promise<ManagedUser> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: buildHeaders(token, true),
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    const detail = await readAPIErrorDetail(response);
    throw new Error(detail);
  }
  return (await response.json()) as ManagedUser;
}

export async function resetAdminUserPassword(
  userId: string,
  newPassword: string,
  token?: string | null,
): Promise<ManagedUser> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}/reset-password`,
    {
      method: "POST",
      headers: buildHeaders(token, true),
      body: JSON.stringify({ new_password: newPassword }),
    },
  );
  if (!response.ok) {
    const detail = await readAPIErrorDetail(response);
    throw new Error(detail);
  }
  return (await response.json()) as ManagedUser;
}

export async function deleteAdminUser(
  userId: string,
  token?: string | null,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: buildHeaders(token),
    },
  );
  if (!response.ok) {
    const detail = await readAPIErrorDetail(response);
    throw new Error(detail);
  }
}
