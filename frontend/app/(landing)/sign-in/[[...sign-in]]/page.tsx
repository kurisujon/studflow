import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mt-[80px] flex min-h-[calc(100dvh-80px)] items-center justify-center p-4">
      <SignIn appearance={{ variables: { colorPrimary: "var(--theme-primary)", colorBackground: "var(--card)", colorText: "var(--foreground)", colorTextSecondary: "var(--muted-foreground)", colorInputBackground: "var(--background)", colorInputText: "var(--foreground)", borderRadius: "0.75rem" } }} />
    </div>
  );
}
