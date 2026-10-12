"use client";

import { InteractiveSummaryReader } from "@/components/study/InteractiveSummaryReader";
import type { StudyDocument } from "@/lib/types";

type SummaryData = NonNullable<StudyDocument["summary_data"]>;

export function SummaryStudy({
  documentId,
  summary,
  initialPanel,
  active = true,
}: {
  documentId: string;
  summary: SummaryData | null;
  initialPanel?: string;
  active?: boolean;
}) {
  return <InteractiveSummaryReader documentId={documentId} summary={summary} initialPanel={initialPanel} active={active} />;
}
