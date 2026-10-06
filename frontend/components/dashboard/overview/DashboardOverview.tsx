import Link from "next/link";
import { ArrowRightIcon as ArrowRight } from "@/components/home/icon-registry";
import type { DocumentListItem, UserStats, UserQueue } from "@/lib/types";

import { DashboardHeader } from "./DashboardHeader";
import { DocumentFlowCard } from "./DocumentFlowCard";
import { EmptyDashboard } from "./EmptyDashboard";
import { StatsGrid } from "./StatsGrid";
import { ReviewQueue } from "./ReviewQueue";
import { StudyStreak } from "./StudyStreak";
import { QuickActions } from "./QuickActions";
import { getPrimaryAction } from "./utils";

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
  const recentDocuments = documents.slice(0, 3);
  const primaryAction = getPrimaryAction(documents, queue);

  return (
    <div className="flex flex-col gap-8 pb-8">
      <DashboardHeader primaryAction={primaryAction} />

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (Documents + Stats) */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Documents Section */}
          <section aria-labelledby="continue-heading" className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="continue-heading" className="text-xl font-bold text-[var(--foreground)]">
                  Continue your flow
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Pick up where you left off.
                </p>
              </div>
              <Link
                href="/dashboard/docs"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] transition-colors hover:text-[var(--theme-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-md"
              >
                View all
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            
            {recentDocuments.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentDocuments.map((document) => (
                  <li key={document.id}>
                    <DocumentFlowCard document={document} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyDashboard />
            )}
          </section>

          {/* Stats Section */}
          <StatsGrid stats={stats} />
        </div>

        {/* Right Column (Queue, Streak, Actions) */}
        <div className="flex flex-col gap-6">
          <ReviewQueue queue={queue} />
          <StudyStreak stats={stats} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
