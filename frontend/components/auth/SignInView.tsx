"use client";

import { useEffect, useRef, useState } from "react";
import { SignIn, useAuth, useClerk } from "@clerk/nextjs";
import { ArrowRightIcon, Loader2Icon } from "@/components/home/icon-registry";

type ClerkInternalWindow = Window & {
  __internal_onBeforeSetActive?: (intent?: string) => Promise<void> | void;
  __studflowGuardedBeforeSetActive?: boolean;
};

function SignInLoadingCard() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading sign-in form"
      className="flex w-full max-w-[400px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
    >
      <Loader2Icon className="size-6 animate-spin text-[var(--theme-primary)]" />
      <p className="mt-3 text-sm font-medium text-foreground">
        Loading sign-in...
      </p>
    </div>
  );
}

export function SignInView({
  fallbackRedirectUrl,
}: {
  fallbackRedirectUrl: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const [isCompleting, setIsCompleting] = useState(false);
  const redirectedRef = useRef(false);

  // Guard Clerk's Next.js cache-invalidation hook so an uncaught Server Action
  // error or network stall never leaves setActive() hanging on /sign-in/factor-one.
  useEffect(() => {
    const clerkWindow = window as ClerkInternalWindow;
    const originalBeforeSetActive = clerkWindow.__internal_onBeforeSetActive;
    if (originalBeforeSetActive && !clerkWindow.__studflowGuardedBeforeSetActive) {
      clerkWindow.__studflowGuardedBeforeSetActive = true;
      clerkWindow.__internal_onBeforeSetActive = (intent?: string) =>
        Promise.race([
          Promise.resolve(originalBeforeSetActive(intent)).catch(() => undefined),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 1500);
          }),
        ]);
    }
  }, []);

  const isClerkActiveOrComplete = Boolean(
    clerk.loaded &&
      (clerk.session ||
        clerk.client?.signIn?.status === "complete" ||
        (clerk.client?.signedInSessions?.length ?? 0) > 0),
  );

  // Track Clerk sign-in completion immediately, even before Next.js transition settles.
  useEffect(() => {
    const unsubscribe = clerk.addListener(({ client, session }) => {
      if (
        session ||
        client?.signIn?.status === "complete" ||
        (client?.signedInSessions?.length ?? 0) > 0
      ) {
        setIsCompleting(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [clerk]);

  const showRedirectState =
    Boolean(isLoaded && isSignedIn) || isCompleting || isClerkActiveOrComplete;

  // Hard-navigate once signed in so stale Next.js router cache entries cannot bounce back.
  useEffect(() => {
    if (isLoaded && isSignedIn && !redirectedRef.current) {
      redirectedRef.current = true;
      window.location.replace(fallbackRedirectUrl);
    }
  }, [fallbackRedirectUrl, isLoaded, isSignedIn]);

  // Safety fallback if sign-in completed but navigation has not left /sign-in.
  useEffect(() => {
    if (!showRedirectState || (isLoaded && isSignedIn) || redirectedRef.current) {
      return;
    }

    const timerId = window.setTimeout(async () => {
      if (redirectedRef.current) {
        return;
      }
      redirectedRef.current = true;
      try {
        if (!clerk.session && clerk.client?.lastActiveSessionId) {
          await clerk.setActive({ session: clerk.client.lastActiveSessionId });
        }
      } catch {
        // Proceed with full navigation so server middleware/session check resolves state.
      }
      window.location.replace(fallbackRedirectUrl);
    }, 1800);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [clerk, fallbackRedirectUrl, showRedirectState, isLoaded, isSignedIn]);

  return (
    <div className="mt-[80px] flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center p-4">
      {showRedirectState ? (
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <Loader2Icon className="size-6 animate-spin text-[var(--theme-primary)]" />
          <h1 className="mt-4 text-lg font-semibold text-foreground">
            Signed in successfully
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Opening your StudFlow workspace...
          </p>
          <a
            href={fallbackRedirectUrl}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)] shadow-sm transition hover:bg-[var(--theme-primary-hover)]"
          >
            <span>Go to Dashboard</span>
            <ArrowRightIcon className="size-4" />
          </a>
        </div>
      ) : null}

      <div
        className={
          showRedirectState
            ? "hidden"
            : "flex w-full flex-col items-center justify-center"
        }
      >
        <SignIn
          fallbackRedirectUrl={fallbackRedirectUrl}
          signUpUrl="/sign-up"
          fallback={<SignInLoadingCard />}
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
            elements: {
              socialButtons: { display: "none" },
              socialButtonsBlockButton: { display: "none" },
              socialButtonsRoot: { display: "none" },
              dividerRow: { display: "none" },
              footerAction: { display: "none" },
            },
          }}
        />
        <p className="mt-4 max-w-sm text-center text-xs text-muted-foreground">
          Access is limited to registered accounts. Need an account? Contact your workspace administrator for an invitation.
        </p>
      </div>
    </div>
  );
}
