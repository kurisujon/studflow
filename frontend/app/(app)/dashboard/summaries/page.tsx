import { SummaryLibraryView } from "@/components/summary-library-view";
import { fetchSummaries } from "@/lib/server-api";

export default async function SummariesPage() {
  const summaries = await fetchSummaries();

  return <SummaryLibraryView summaries={summaries} />;
}
