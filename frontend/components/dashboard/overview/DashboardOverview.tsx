import Link from "next/link";
import {
  ArrowRightIcon,
  BrainIcon,
  CalendarCheckIcon,
  CircleHelpIcon,
  FileTextIcon,
  FlameIcon,
  MessagesSquareIcon,
  SparklesIcon,
  UploadIcon,
} from "@/components/home/icon-registry";
import { PageContainer, PageHeader } from "@/components/dashboard/shared/PageHeader";
import type { DocumentListItem, UserStats } from "@/lib/types";
import { formatDate, getStreakDays, stripExtension } from "./utils";

type DashboardOverviewProps = {
  documents: DocumentListItem[];
  stats: UserStats;
  dueCount: number;
};

function statusCopy(document: DocumentListItem) {
  if (document.status === "COMPLETED") return "Ready to study";
  if (document.status === "FAILED") return "Processing needs attention";
  return "Processing material";
}

export function DashboardOverview({ documents, stats, dueCount }: DashboardOverviewProps) {
  const completed = documents.filter((item) => item.status === "COMPLETED");
  const continueDocument = completed[0];
  const recentDocuments = documents.slice(0, 5);
  const activityDays = getStreakDays(stats.streak_activity);
  const hasRecentQuizActivity = activityDays.some((day) => day.active);
  const metrics = [
    { label: "Learning materials", value: String(stats.total_documents), detail: "Uploaded sources", icon: FileTextIcon, tone: "indigo" },
    { label: "Flashcards", value: String(stats.total_flashcards), detail: dueCount ? `${dueCount} due now` : "Review queue clear", icon: BrainIcon, tone: "violet" },
    { label: "Average quiz score", value: `${Math.round(stats.avg_quiz_score)}%`, detail: stats.avg_quiz_score === 0 ? "Attempt count unavailable" : "From saved attempts", icon: CircleHelpIcon, tone: "amber" },
    { label: "Quiz streak", value: `${stats.streak_days}d`, detail: "Consecutive quiz days", icon: FlameIcon, tone: "orange" },
  ] as const;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Your learning workspace"
        title="Overview"
        description="Move from source material to understanding, practice, and review."
      />

      <div className="grid gap-4 xl:grid-cols-12" aria-label="Learning overview">
        <section className="bento-hero xl:col-span-8" aria-labelledby="continue-studying-title">
          {continueDocument ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <span className="bento-icon bento-icon-hero"><FileTextIcon className="size-6" aria-hidden="true" /></span>
                <span className="bento-status">Ready</span>
              </div>
              <div className="mt-8 min-w-0">
                <p className="bento-kicker">Continue studying</p>
                <h2 id="continue-studying-title" className="mt-2 truncate text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-[1.9rem]" title={continueDocument.filename}>
                  {stripExtension(continueDocument.filename)}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {continueDocument.page_count ? `${continueDocument.page_count} pages · ` : ""}
                  {continueDocument.flashcard_count} flashcards{continueDocument.quiz_ready ? " · Quiz ready" : ""}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2" aria-label="Available study tools">
                {continueDocument.summary_ready ? <span className="bento-tool-tag">Summary</span> : null}
                {continueDocument.flashcard_count > 0 ? <span className="bento-tool-tag">Flashcards</span> : null}
                {continueDocument.quiz_ready ? <span className="bento-tool-tag">Quiz</span> : null}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={`/dashboard/study/${continueDocument.id}`} className="bento-primary-action">
                  Open workspace <ArrowRightIcon className="size-4" aria-hidden="true" />
                </Link>
                {continueDocument.summary_ready ? <Link href={`/dashboard/study/${continueDocument.id}?tab=summary`} className="bento-secondary-action">Read summary</Link> : null}
              </div>
            </>
          ) : (
            <div className="flex min-h-[238px] flex-col justify-between">
              <span className="bento-icon bento-icon-hero"><SparklesIcon className="size-6" aria-hidden="true" /></span>
              <div>
                <p className="bento-kicker">Your next learning space</p>
                <h2 id="continue-studying-title" className="mt-2 text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-[1.9rem]">Start with a source</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Upload a PDF or DOCX and StudFlow will prepare its summary, flashcards, and quiz when processing is complete.</p>
              </div>
              <div className="mt-6"><Link href="/upload" className="bento-primary-action">Upload material <UploadIcon className="size-4" aria-hidden="true" /></Link></div>
            </div>
          )}
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
          <section className="bento-utility min-h-[176px]" aria-labelledby="review-title">
            <div className="flex items-start justify-between gap-4">
              <span className="bento-icon bento-icon-review"><CalendarCheckIcon className="size-5" aria-hidden="true" /></span>
              <span className={`bento-count ${dueCount ? "" : "bento-count-clear"}`}>{dueCount}</span>
            </div>
            <div className="mt-5">
              <h2 id="review-title" className="text-base font-bold tracking-tight text-foreground">Today&apos;s Review</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{dueCount ? `${dueCount} card${dueCount === 1 ? "" : "s"} scheduled for review.` : "You&apos;re caught up for now."}</p>
            </div>
            <Link href="/dashboard/review" className="bento-text-link mt-4">{dueCount ? "Start review" : "Open review hub"}<ArrowRightIcon className="size-3.5" aria-hidden="true" /></Link>
          </section>

          <section className="bento-utility min-h-[176px]" aria-labelledby="quick-actions-title">
            <div className="flex items-center justify-between gap-3"><div><h2 id="quick-actions-title" className="text-base font-bold tracking-tight text-foreground">Quick actions</h2><p className="mt-1 text-xs text-muted-foreground">Jump into a learning task.</p></div><SparklesIcon className="size-5 text-[var(--theme-primary)]" aria-hidden="true" /></div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <QuickAction href="/upload" label="Upload" icon={UploadIcon} />
              <QuickAction href="/dashboard/docs" label="Library" icon={FileTextIcon} />
              <QuickAction href="/dashboard/assistant" label="Ask AI" icon={MessagesSquareIcon} />
              <QuickAction href="/dashboard/quizzes" label="Practice" icon={CircleHelpIcon} />
            </div>
          </section>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Learning metrics">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className="bento-metric">
            <span className={`bento-icon bento-icon-${tone}`}><Icon className="size-4" aria-hidden="true" /></span>
            <p className="mt-5 text-2xl font-bold leading-none tracking-[-0.04em] text-foreground sm:text-[1.75rem]">{value}</p>
            <h2 className="mt-2 text-sm font-semibold text-foreground">{label}</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground" title={detail}>{detail}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="xl:col-span-8" aria-labelledby="recent-materials-title">
          <div className="flex items-end justify-between gap-4 px-1 pb-4">
            <div><h2 id="recent-materials-title" className="text-lg font-bold tracking-tight text-foreground">Recent learning materials</h2><p className="mt-1 text-sm text-muted-foreground">Your latest sources, ready when you are.</p></div>
            <Link href="/dashboard/docs" className="bento-text-link shrink-0">View library<ArrowRightIcon className="size-3.5" aria-hidden="true" /></Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)]">
            {recentDocuments.length ? recentDocuments.map((document) => <RecentMaterial key={document.id} document={document} />) : <div className="px-5 py-10 text-center"><p className="font-semibold text-foreground">No materials yet</p><p className="mt-1 text-sm text-muted-foreground">Your uploaded sources will appear here.</p></div>}
          </div>
        </section>

        <section className="bento-activity xl:col-span-4" aria-labelledby="activity-title">
          <div className="flex items-start justify-between gap-3"><div><p className="bento-kicker">Last seven days</p><h2 id="activity-title" className="mt-1 text-lg font-bold tracking-tight text-foreground">Quiz activity</h2></div><span className="bento-activity-streak"><FlameIcon className="size-3.5" aria-hidden="true" />{stats.streak_days}d</span></div>
          {hasRecentQuizActivity ? <ol className="mt-7 grid grid-cols-7 gap-2" aria-label="Quiz activity by day">{activityDays.map((day) => <li key={day.key} className="min-w-0 text-center"><span role="img" aria-label={`${day.fullLabel}: ${day.active ? "quiz activity recorded" : "no quiz activity recorded"}`} className={`mx-auto block h-11 w-full max-w-10 rounded-lg border ${day.active ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] shadow-[0_8px_18px_var(--theme-shadow)]" : "border-border bg-muted"}`} /><span className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{day.label}</span></li>)}</ol> : <div className="mt-7 rounded-xl border border-dashed border-border bg-muted/45 px-4 py-6 text-center"><p className="text-sm font-semibold text-foreground">No quiz activity yet</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Complete a saved document quiz to see activity here.</p></div>}
          <p className="mt-5 text-xs leading-5 text-muted-foreground">This shows recorded quiz activity, not total study time.</p>
        </section>
      </div>
    </PageContainer>
  );
}

function QuickAction({ href, label, icon: Icon }: { href: string; label: string; icon: typeof UploadIcon }) {
  return <Link href={href} className="bento-quick-action"><Icon className="size-3.5" aria-hidden="true" /><span className="truncate">{label}</span></Link>;
}

function RecentMaterial({ document }: { document: DocumentListItem }) {
  const ready = document.status === "COMPLETED";
  const href = ready ? `/dashboard/study/${document.id}` : "/dashboard/docs";
  return <Link href={href} className="group flex min-w-0 items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-0 hover:bg-muted/55 focus-visible:bg-muted/55 sm:px-5">
    <span className="bento-icon bento-icon-document size-9 rounded-xl"><FileTextIcon className="size-4" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground group-hover:text-[var(--theme-primary)]" title={document.filename}>{document.filename}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{formatDate(document.updated_at)} · {statusCopy(document)}</span></span>
    <span className={`hidden rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide sm:inline ${ready ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : document.status === "FAILED" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{ready ? "Ready" : document.status === "FAILED" ? "Failed" : "Processing"}</span>
    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--theme-primary)]" aria-hidden="true" />
  </Link>;
}
