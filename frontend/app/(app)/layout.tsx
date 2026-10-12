import { AppShell } from "@/components/app-shell/AppShell";
import { fetchDocuments } from "@/lib/server-api";
import { unstable_rethrow } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const documents = await fetchDocuments().catch((error: unknown) => {
    unstable_rethrow(error);
    return [];
  });
  return <AppShell documents={documents}>{children}</AppShell>;
}
