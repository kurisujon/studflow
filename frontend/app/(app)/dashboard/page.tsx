import { DashboardOverview } from "@/components/dashboard/overview/DashboardOverview";
import { fetchDocuments, fetchDueFlashcards, fetchUserStats } from "@/lib/server-api";

export default async function DashboardPage() {
  const [documents, stats, dueFlashcards] = await Promise.all([
    fetchDocuments(),
    fetchUserStats(),
    fetchDueFlashcards(),
  ]);

  return (
    <DashboardOverview documents={documents} stats={stats} dueCount={dueFlashcards.length} />
  );
}
