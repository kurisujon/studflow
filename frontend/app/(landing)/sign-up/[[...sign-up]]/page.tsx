import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { LockIcon } from "@/components/home/icon-registry";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const hasClerkInvitationTicket = Boolean(resolvedParams?.__clerk_ticket);

  if (hasClerkInvitationTicket) {
    return (
      <div className="mt-[80px] flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center p-4">
        <div className="mb-4 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          Invitation verified — complete your account setup below
        </div>
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "var(--theme-primary)",
              colorBackground: "var(--card)",
              colorText: "var(--foreground)",
              colorTextSecondary: "var(--muted-foreground)",
              colorInputBackground: "var(--background)",
              colorInputText: "var(--foreground)",
              borderRadius: "0.75rem",
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="mt-[80px] flex min-h-[calc(100dvh-80px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[var(--theme-soft)] text-[var(--theme-primary)]">
          <LockIcon className="size-6" />
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Invite-Only Workspace
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          Registration is Managed by Admin
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Public registration is disabled for StudFlow. Accounts must be registered or invited by a workspace administrator before you can sign in.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/sign-in"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)] shadow-sm transition hover:bg-[var(--theme-primary-hover)]"
          >
            Sign In to Existing Account
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
