"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import {
  AlertCircleIcon,
  BanIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "@/components/home/icon-registry";
import {
  createAdminInvitation,
  createAdminUser,
  deleteAdminUser,
  getAdminUsersOverview,
  resetAdminUserPassword,
  revokeAdminInvitation,
  updateAdminUserAccess,
} from "@/lib/api/admin";
import type {
  AdminUsersOverview,
  ManagedUser,
  UserRole,
} from "@/lib/types";

type FilterTab = "all" | "active" | "pending" | "suspended" | "admins";
type ProvisionMode = "direct" | "invite";

function generateSecurePassword(length: number = 14): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (val) => chars[val % chars.length]).join("");
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function AdminUsersClient({
  initialOverview,
  currentAdminId,
}: {
  initialOverview: AdminUsersOverview;
  currentAdminId: string;
}) {
  const { getToken } = useAuth();
  const [overview, setOverview] = useState<AdminUsersOverview>(initialOverview);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Create / Invite modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [provisionMode, setProvisionMode] = useState<ProvisionMode>("direct");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [role, setRole] = useState<UserRole>("user");
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password?: string;
    mode: ProvisionMode;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [submittingReset, setSubmittingReset] = useState(false);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  async function refreshOverview() {
    setRefreshing(true);
    try {
      const token = await getToken();
      const latest = await getAdminUsersOverview(token);
      setOverview(latest);
    } catch (error) {
      setBanner({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to refresh users.",
      });
    } finally {
      setRefreshing(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return overview.users.filter((user) => {
      if (filter === "active" && user.status !== "active") return false;
      if (filter === "pending" && user.status !== "pending") return false;
      if (filter === "suspended" && user.status !== "suspended") return false;
      if (filter === "admins" && user.role !== "admin") return false;
      if (!q) return true;
      return (
        user.full_name.toLowerCase().includes(q) ||
        (user.email?.toLowerCase().includes(q) ?? false) ||
        user.clerk_user_id.toLowerCase().includes(q)
      );
    });
  }, [overview.users, filter, search]);

  function openProvisionModal(mode: ProvisionMode) {
    setProvisionMode(mode);
    setEmail("");
    setFirstName("");
    setLastName("");
    setPassword(generateSecurePassword());
    setRole("user");
    setCreatedCredentials(null);
    setCopiedCreds(false);
    setCreateModalOpen(true);
  }

  async function handleProvisionSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingCreate(true);
    setBanner(null);

    try {
      const token = await getToken();
      if (provisionMode === "direct") {
        await createAdminUser(
          {
            email: email.trim(),
            password,
            first_name: firstName.trim() || undefined,
            last_name: lastName.trim() || undefined,
            role,
          },
          token,
        );
        setCreatedCredentials({
          email: email.trim(),
          password,
          mode: "direct",
        });
        setBanner({
          type: "success",
          message: `Account registered for ${email.trim()}.`,
        });
      } else {
        const redirectUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/sign-up`
            : undefined;
        await createAdminInvitation(
          {
            email: email.trim(),
            role,
            redirect_url: redirectUrl,
          },
          token,
        );
        setCreatedCredentials({
          email: email.trim(),
          mode: "invite",
        });
        setBanner({
          type: "success",
          message: `Invitation email sent to ${email.trim()}.`,
        });
      }
      await refreshOverview();
    } catch (error) {
      setBanner({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to provision account.",
      });
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleQuickAccessUpdate(
    user: ManagedUser,
    patch: { approved?: boolean; suspended?: boolean; role?: UserRole },
    successMessage: string,
  ) {
    setBusyUserId(user.clerk_user_id);
    setBanner(null);
    try {
      const token = await getToken();
      await updateAdminUserAccess(user.clerk_user_id, patch, token);
      setBanner({ type: "success", message: successMessage });
      await refreshOverview();
    } catch (error) {
      setBanner({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to update user.",
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRevokeInvite(invitationId: string, inviteEmail: string) {
    setBusyInviteId(invitationId);
    setBanner(null);
    try {
      const token = await getToken();
      await revokeAdminInvitation(invitationId, token);
      setBanner({
        type: "success",
        message: `Revoked pending invitation for ${inviteEmail}.`,
      });
      await refreshOverview();
    } catch (error) {
      setBanner({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to revoke invitation.",
      });
    } finally {
      setBusyInviteId(null);
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setSubmittingReset(true);
    setBanner(null);
    try {
      const token = await getToken();
      await resetAdminUserPassword(
        resetTarget.clerk_user_id,
        newPassword,
        token,
      );
      setBanner({
        type: "success",
        message: `Password updated for ${resetTarget.email || resetTarget.full_name}.`,
      });
      setResetTarget(null);
      setNewPassword("");
    } catch (error) {
      setBanner({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to reset password.",
      });
    } finally {
      setSubmittingReset(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setSubmittingDelete(true);
    setBanner(null);
    try {
      const token = await getToken();
      await deleteAdminUser(deleteTarget.clerk_user_id, token);
      setBanner({
        type: "success",
        message: `Deleted account ${deleteTarget.email || deleteTarget.full_name}.`,
      });
      setDeleteTarget(null);
      await refreshOverview();
    } catch (error) {
      setBanner({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete user.",
      });
    } finally {
      setSubmittingDelete(false);
    }
  }

  async function copyCredentialsToClipboard() {
    if (!createdCredentials) return;
    const text = createdCredentials.password
      ? `StudFlow Login Credentials\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`
      : `StudFlow Invitation sent to: ${createdCredentials.email}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    } catch {}
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-primary)]/20 bg-[var(--theme-soft)] px-3 py-1 text-xs font-semibold text-[var(--theme-primary)]">
            <ShieldIcon className="size-3.5" />
            Admin Access Control
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            User Management & Provisioning
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register accounts directly, send self-serve email invitations, or approve pending sign-ins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={refreshOverview}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            <RefreshCwIcon
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => openProvisionModal("invite")}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-xs transition hover:bg-muted"
          >
            <MailIcon className="size-4 text-[var(--theme-primary)]" />
            Send Email Invite
          </button>
          <button
            type="button"
            onClick={() => openProvisionModal("direct")}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)] shadow-sm transition hover:bg-[var(--theme-primary-hover)]"
          >
            <UserPlusIcon className="size-4" />
            Register Account
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {banner ? (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {banner.type === "success" ? (
              <CheckCircle2Icon className="size-4 shrink-0" />
            ) : (
              <AlertCircleIcon className="size-4 shrink-0" />
            )}
            <span className="font-medium">{banner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="rounded-lg p-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ) : null}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Accounts
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {overview.counts.total_users}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Active Approved
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {overview.counts.active_users}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Pending Approval
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {overview.counts.pending_users}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
            Suspended
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {overview.counts.suspended_users}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-border bg-card p-4 shadow-2xs sm:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-primary)]">
            Administrators
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {overview.counts.admin_users}
          </p>
        </div>
      </div>

      {/* Pending Email Invitations */}
      {overview.invitations.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              <MailIcon className="size-4 text-[var(--theme-primary)]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Pending Email Invitations ({overview.invitations.length})
              </h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {overview.invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {inv.email_address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Role: <span className="font-medium uppercase">{inv.role}</span> · Sent{" "}
                    {formatDate(inv.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyInviteId === inv.id}
                  onClick={() => handleRevokeInvite(inv.id, inv.email_address)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
                >
                  {busyInviteId === inv.id ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <XIcon className="size-3.5" />
                  )}
                  Revoke Invite
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: "All Users", count: overview.counts.total_users },
              { id: "active", label: "Active", count: overview.counts.active_users },
              {
                id: "pending",
                label: "Pending Approval",
                count: overview.counts.pending_users,
              },
              {
                id: "suspended",
                label: "Suspended",
                count: overview.counts.suspended_users,
              },
              { id: "admins", label: "Admins", count: overview.counts.admin_users },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition ${
                  active
                    ? "bg-[var(--theme-primary)] text-[var(--theme-on-primary)] shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Joined / Last Sign-In</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    <UsersIcon className="mx-auto mb-2 size-8 opacity-40" />
                    No users match the current filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user.clerk_user_id === currentAdminId;
                  const isBusy = busyUserId === user.clerk_user_id;
                  const initials = (user.full_name || user.email || "U")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={user.clerk_user_id}
                      className="transition hover:bg-muted/30"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--theme-soft)] text-xs font-bold text-[var(--theme-primary)]">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-semibold text-foreground">
                                {user.full_name}
                              </span>
                              {isSelf ? (
                                <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                                  You
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email || user.clerk_user_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.role === "admin"
                              ? "border border-[var(--theme-primary)]/30 bg-[var(--theme-soft)] text-[var(--theme-primary)]"
                              : "border border-border bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <ShieldIcon className="size-3" />
                          ) : null}
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {user.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : user.status === "suspended" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Pending Approval
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <div>Joined: {formatDate(user.created_at)}</div>
                        <div>Last login: {formatDate(user.last_sign_in_at)}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* Approve button for pending users */}
                          {user.status === "pending" ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleQuickAccessUpdate(
                                  user,
                                  { approved: true, suspended: false },
                                  `Approved access for ${user.email || user.full_name}.`,
                                )
                              }
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckIcon className="size-3.5" />
                              Approve
                            </button>
                          ) : null}

                          {/* Suspend / Reactivate toggle */}
                          {!isSelf && user.status === "active" ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleQuickAccessUpdate(
                                  user,
                                  { suspended: true },
                                  `Suspended ${user.email || user.full_name}.`,
                                )
                              }
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-700 disabled:opacity-50 dark:hover:text-amber-300"
                            >
                              <BanIcon className="size-3.5" />
                              Suspend
                            </button>
                          ) : null}

                          {!isSelf && user.status === "suspended" ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleQuickAccessUpdate(
                                  user,
                                  { approved: true, suspended: false },
                                  `Reactivated ${user.email || user.full_name}.`,
                                )
                              }
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300"
                            >
                              <CheckIcon className="size-3.5" />
                              Reactivate
                            </button>
                          ) : null}

                          {/* Role toggle */}
                          {!isSelf ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleQuickAccessUpdate(
                                  user,
                                  {
                                    role:
                                      user.role === "admin" ? "user" : "admin",
                                    approved: true,
                                  },
                                  `Updated role for ${user.email || user.full_name} to ${
                                    user.role === "admin" ? "User" : "Admin"
                                  }.`,
                                )
                              }
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                            >
                              <ShieldIcon className="size-3.5" />
                              {user.role === "admin"
                                ? "Make User"
                                : "Make Admin"}
                            </button>
                          ) : null}

                          {/* Reset Password */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              setResetTarget(user);
                              setNewPassword(generateSecurePassword());
                              setShowNewPassword(true);
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                            title="Reset Password"
                          >
                            <KeyRoundIcon className="size-3.5" />
                            Password
                          </button>

                          {/* Delete User */}
                          {!isSelf ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setDeleteTarget(user)}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                              title="Delete Account"
                              aria-label={`Delete ${user.full_name}`}
                            >
                              <Trash2Icon className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Invite User Modal */}
      {createModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provision-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="provision-modal-title"
                className="text-lg font-bold text-foreground"
              >
                Add Registered User
              </h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="Close modal"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setProvisionMode("direct");
                  setCreatedCredentials(null);
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  provisionMode === "direct"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Direct Account (Password)
              </button>
              <button
                type="button"
                onClick={() => {
                  setProvisionMode("invite");
                  setCreatedCredentials(null);
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  provisionMode === "invite"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Email Invitation Link
              </button>
            </div>

            {createdCredentials ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs">
                  <p className="font-bold text-emerald-800 dark:text-emerald-200">
                    {createdCredentials.mode === "direct"
                      ? "Account Created & Approved!"
                      : "Invitation Email Dispatched!"}
                  </p>
                  <div className="mt-2.5 space-y-1 font-mono text-foreground">
                    <div>Email: {createdCredentials.email}</div>
                    {createdCredentials.password ? (
                      <div>Password: {createdCredentials.password}</div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {createdCredentials.password ? (
                    <button
                      type="button"
                      onClick={copyCredentialsToClipboard}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-xs font-semibold text-[var(--theme-on-primary)] transition hover:bg-[var(--theme-primary-hover)]"
                    >
                      {copiedCreds ? (
                        <>
                          <CheckIcon className="size-4" />
                          Copied Credentials
                        </>
                      ) : (
                        <>
                          <CopyIcon className="size-4" />
                          Copy Credentials
                        </>
                      )}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 text-xs font-semibold text-foreground transition hover:bg-muted"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProvisionSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]"
                  />
                </div>

                {provisionMode === "direct" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Jane"
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">
                          Initial Password * (min 8 chars)
                        </label>
                        <button
                          type="button"
                          onClick={() => setPassword(generateSecurePassword())}
                          className="text-xs font-semibold text-[var(--theme-primary)] hover:underline"
                        >
                          Generate Strong Password
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 w-full rounded-xl border border-border bg-background pl-3 pr-10 font-mono text-sm outline-none transition focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOffIcon className="size-4" />
                          ) : (
                            <EyeIcon className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                    Clerk will email an invitation link to this address. Once accepted, their account is automatically marked as approved.
                  </p>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Workspace Role
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole("user")}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                        role === "user"
                          ? "border-[var(--theme-primary)] bg-[var(--theme-soft)] text-[var(--theme-primary)]"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <UsersIcon className="size-3.5" />
                      Standard User
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                        role === "admin"
                          ? "border-[var(--theme-primary)] bg-[var(--theme-soft)] text-[var(--theme-primary)]"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <ShieldIcon className="size-3.5" />
                      Administrator
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-xs font-semibold text-[var(--theme-on-primary)] shadow-sm transition hover:bg-[var(--theme-primary-hover)] disabled:opacity-50"
                  >
                    {submittingCreate ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : null}
                    {provisionMode === "direct"
                      ? "Create Account"
                      : "Send Invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* Reset Password Modal */}
      {resetTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground">
                Reset User Password
              </h2>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Setting a new password for{" "}
              <span className="font-semibold text-foreground">
                {resetTarget.email || resetTarget.full_name}
              </span>
              .
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    New Password * (min 8 chars)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateSecurePassword())}
                    className="text-xs font-semibold text-[var(--theme-primary)] hover:underline"
                  >
                    Generate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background pl-3 pr-10 font-mono text-sm outline-none transition focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReset}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-xs font-semibold text-[var(--theme-on-primary)] shadow-sm transition hover:bg-[var(--theme-primary-hover)] disabled:opacity-50"
                >
                  {submittingReset ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : null}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Delete User Confirmation Modal */}
      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">
              Delete User Account?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget.email || deleteTarget.full_name}
              </span>
              ? They will immediately lose access to StudFlow.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                onClick={handleConfirmDelete}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
              >
                {submittingDelete ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : null}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
