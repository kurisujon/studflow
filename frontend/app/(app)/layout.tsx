import { AppShell } from "@/components/app-shell/AppShell";
import { fetchDocuments, fetchUserAccessStatus } from "@/lib/server-api";
import { redirect, unstable_rethrow } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessStatus = await fetchUserAccessStatus().catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });

  if (!accessStatus || !accessStatus.approved || accessStatus.suspended) {
    redirect("/access-restricted");
  }

  const documents = await fetchDocuments().catch((error: unknown) => {
    unstable_rethrow(error);
    return [];
  });

  return (
    <AppShell documents={documents} isAdmin={accessStatus.is_admin}>
      {children}
    </AppShell>
  );
}
