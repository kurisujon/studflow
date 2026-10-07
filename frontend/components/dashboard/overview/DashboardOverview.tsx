import Link from "next/link";
import { ArrowRightIcon as ArrowRight, FileTextIcon as FileText } from "@/components/home/icon-registry";
import type { DocumentListItem, UserStats, UserQueue } from "@/lib/types";

import { DashboardHeader } from "./DashboardHeader";
import { DocumentFlowCard } from "./DocumentFlowCard";
import { EmptyDashboard } from "./EmptyDashboard";
import { StatsGrid } from "./StatsGrid";
import { ReviewQueue } from "./ReviewQueue";
import { StudyStreak } from "./StudyStreak";
import { getPrimaryAction, stripExtension } from "./utils";

type DashboardOverviewProps = {
  documents: DocumentListItem[];
  stats: UserStats;
  queue: UserQueue;
};

export function DashboardOverview({
  documents,
  stats,
  queue,
}: DashboardOverviewProps) {
  const primaryAction = getPrimaryAction(documents, queue);
  const primaryDocument = documents[0];
  const recentDocuments = documents.slice(1, 4);

  return (
    <div className="flex flex-col gap-10 pb-12">
      <div className="flex flex-col gap-8 border-b border-[var(--border)] pb-8">
        <DashboardHeader primaryAction={primaryAction} />
        <StatsGrid stats={stats} />
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (Primary Document / Empty) */}
        <div className="lg:col-span-2">
          {primaryDocument ? (
            <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="flex-1 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--theme-soft)] text-[var(--theme-primary)]">
                    <FileText aria-hidden="true" className="size-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">Continue Studying</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Pick up where you left off</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="line-clamp-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    {stripExtension(primaryDocument.filename)}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                     <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Ready</span>
                     {primaryDocument.summary_ready && (
                       <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">Summary</span>
                     )}
                     {primaryDocument.flashcard_count > 0 && (
                       <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">{primaryDocument.flashcard_count} Flashcards</span>
                     )}
                     {primaryDocument.quiz_ready && (
                       <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">Quiz</span>
                     )}
                  </div>
                </div>
              </div>
              <div className="border-t border-[var(--border)] bg-[var(--muted)/30] p-4 sm:px-8">
                <Link
                  href={`/dashboard/study/${primaryDocument.id}`}
                  className="inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]"
                >
                  Enter Workspace
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          ) : (
            <EmptyDashboard />
          )}
        </div>

        {/* Right Column (Queue, Streak) */}
        <div className="flex flex-col gap-6">
          <ReviewQueue queue={queue} />
          <StudyStreak stats={stats} />
        </div>
      </div>

      {recentDocuments.length > 0 && (
        <section aria-labelledby="recent-heading" className="flex flex-col gap-4 pt-4">
          <div className="flex items-center justify-between gap-4 px-2">
            <h2 id="recent-heading" className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Recent Materials
            </h2>
            <Link
              href="/dashboard/docs"
              className="text-xs font-semibold text-[var(--theme-primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="flex flex-col">
            {recentDocuments.map((document) => (
              <DocumentFlowCard key={document.id} document={document} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
