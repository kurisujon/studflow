import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-height))] items-center justify-center p-4">
      <SignIn />
    </div>
  );
}
