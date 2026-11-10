import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mt-[80px] flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center p-4">
      <SignIn
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
            footerAction: { display: "none" },
          },
        }}
      />
      <p className="mt-4 max-w-sm text-center text-xs text-muted-foreground">
        Access is limited to registered accounts. Need an account? Contact your workspace administrator for an invitation.
      </p>
    </div>
  );
}
