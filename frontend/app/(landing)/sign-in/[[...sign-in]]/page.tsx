import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInView } from "@/components/auth/SignInView";
import { resolveSafeRedirectPath } from "@/lib/safe-redirect";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ userId }, resolvedParams] = await Promise.all([
    auth(),
    searchParams,
  ]);
  const destination = resolveSafeRedirectPath(resolvedParams?.redirect_url);

  if (userId) {
    redirect(destination);
  }

  return <SignInView fallbackRedirectUrl={destination} />;
}
