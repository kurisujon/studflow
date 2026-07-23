import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { fetchDocuments, fetchUserQueue, fetchUserStats } from "@/lib/server-api";

export default async function DashboardPage() {
  const [documents, stats, queue] = await Promise.all([
    fetchDocuments(),
    fetchUserStats(),
    fetchUserQueue(),
  ]);

  return (
    <DashboardOverview documents={documents} stats={stats} queue={queue} />
  );
}
