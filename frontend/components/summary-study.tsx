"use client";

import { InteractiveSummaryReader } from "@/components/study/InteractiveSummaryReader";
import type { StudyDocument } from "@/lib/types";

type SummaryData = NonNullable<StudyDocument["summary_data"]>;

export function SummaryStudy({
  documentId,
  summary,
}: {
  documentId: string;
  summary: SummaryData | null;
}) {
  return <InteractiveSummaryReader documentId={documentId} summary={summary} />;
}
