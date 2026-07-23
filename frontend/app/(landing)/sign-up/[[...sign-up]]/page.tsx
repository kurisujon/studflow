import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="mt-[80px] flex min-h-[calc(100dvh-80px)] items-center justify-center p-4">
      <SignUp />
    </div>
  );
}
