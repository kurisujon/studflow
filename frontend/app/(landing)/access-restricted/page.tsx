import { SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BanIcon, LockIcon, LogOutIcon, RefreshCwIcon } from "@/components/home/icon-registry";
import { fetchUserAccessStatus } from "@/lib/server-api";
import { unstable_rethrow } from "next/navigation";

export default async function AccessRestrictedPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const access = await fetchUserAccessStatus().catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });

  if (access && access.approved && !access.suspended) {
    redirect("/dashboard");
  }

  const isSuspended = Boolean(access?.suspended);

  return (
    <div className="mt-[80px] flex min-h-[calc(100dvh-80px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div
          className={`mx-auto mb-4 grid size-12 place-items-center rounded-2xl ${
            isSuspended
              ? "bg-red-500/10 text-red-600 dark:text-red-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          {isSuspended ? (
            <BanIcon className="size-6" />
          ) : (
            <LockIcon className="size-6" />
          )}
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
            isSuspended
              ? "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300"
              : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {isSuspended ? "Account Suspended" : "Pending Admin Approval"}
        </span>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {isSuspended
            ? "Your Access Has Been Suspended"
            : "Workspace Access Restricted"}
        </h1>

        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          {isSuspended
            ? "An administrator has suspended access for this account. Please contact your workspace administrator if you believe this is an error."
            : "StudFlow is limited to registered accounts. Your sign-in was recorded, and an administrator can approve your account from the Admin Dashboard."}
        </p>

        {access?.email ? (
          <div className="mt-5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-left text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-muted-foreground">Signed in as</span>
              <span className="truncate font-semibold text-foreground">{access.email}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)] shadow-sm transition hover:bg-[var(--theme-primary-hover)]"
          >
            <RefreshCwIcon className="size-4" />
            Check Access Status
          </Link>

          <SignOutButton redirectUrl="/sign-in">
            <button
              type="button"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <LogOutIcon className="size-4" />
              Sign Out & Switch Account
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
