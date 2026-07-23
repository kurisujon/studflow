import Link from "next/link";
import type { SVGProps } from "react";

import { RetryDocumentButton } from "@/components/retry-document-button";
import type { DocumentListItem, UserQueue, UserStats } from "@/lib/types";

type DashboardOverviewProps = {
  documents: DocumentListItem[];
  stats: UserStats;
  queue: UserQueue;
};

function createIcon(paths: string[]) {
  return function DashboardIcon({
    className,
    ...props
  }: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {paths.map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    );
  };
}

const ArrowRight = createIcon(["M5 12h14", "m13 6 6 6-6 6"]);
const BookOpen = createIcon(["M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z", "M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"]);
const Brain = createIcon(["M9.5 4.5A3 3 0 0 0 4 6a3 3 0 0 0 0 5 3.5 3.5 0 0 0 2 6.5A3 3 0 0 0 11 19V5", "M14.5 4.5A3 3 0 0 1 20 6a3 3 0 0 1 0 5 3.5 3.5 0 0 1-2 6.5A3 3 0 0 1 13 19V5"]);
const CheckCircle2 = createIcon(["M22 11.1V12a10 10 0 1 1-5.9-9.1", "m9 11 3 3L22 4"]);
const Clock3 = createIcon(["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M12 6v6l4 2"]);
const FileText = createIcon(["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h8"]);
const Flame = createIcon(["M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 3-1 4-2 5 0-5-3-8-3-8 0 4-5 6-5 11 0 4 3 6 7 6z"]);
const Library = createIcon(["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M4 4v15.5", "M8 4h12v13H8z"]);
const Plus = createIcon(["M12 5v14", "M5 12h14"]);
const RotateCcw = createIcon(["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5"]);
const Sparkles = createIcon(["m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2z", "m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8z"]);
const Target = createIcon(["M22 12a10 10 0 1 1-10-10", "M18 12a6 6 0 1 1-6-6", "M14 12a2 2 0 1 1-2-2", "m14 10 7-7"]);
const Upload = createIcon(["M12 16V4", "m7 9 5-5 5 5", "M5 20h14"]);

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2";

export function DashboardOverview({
  documents,
  stats,
  queue,
}: DashboardOverviewProps) {
  const recentDocuments = documents.slice(0, 3);
  const primaryAction = getPrimaryAction(documents, queue);

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <CommandHeader primaryAction={primaryAction} />

      <section aria-labelledby="continue-heading" className="space-y-4">
        <SectionHeading
          eyebrow="Pick up where you left off"
          title="Continue your flow"
          id="continue-heading"
          action={{ href: "/dashboard/docs", label: "View all documents" }}
        />
        {recentDocuments.length > 0 ? (
          <ul className="grid gap-4 lg:grid-cols-3">
            {recentDocuments.map((document) => (
              <li key={document.id}>
                <DocumentFlowCard document={document} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyDocuments />
        )}
      </section>

      <StatsGrid stats={stats} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <ReviewQueue queue={queue} />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <StudyStreak stats={stats} />
          <QuickActions />
        </div>
      </section>
    </main>
  );
}

function CommandHeader({
  primaryAction,
}: {
  primaryAction: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--theme-border)] bg-[var(--card)] p-6 shadow-[0_18px_50px_var(--theme-shadow)] sm:p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 88% 15%, color-mix(in srgb, var(--theme-primary) 22%, transparent), transparent 34%), linear-gradient(135deg, color-mix(in srgb, var(--theme-soft) 70%, transparent), transparent 62%)",
        }}
      />
      <div className="relative max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--background)]/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--theme-primary)]">
          <Sparkles aria-hidden="true" className="size-4" />
          Your study command center
        </div>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
          Ready to build momentum?
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
          Continue a document, clear today&apos;s reviews, or turn fresh notes
          into your next focused study session.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/upload"
            className={`${actionClass} bg-[var(--theme-primary)] text-white shadow-lg shadow-black/10 hover:brightness-105`}
          >
            <Upload aria-hidden="true" className="size-4" />
            Upload a document
          </Link>
          <Link
            href={primaryAction.href}
            className={`${actionClass} border border-[var(--theme-border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--theme-primary)]`}
          >
            {primaryAction.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  id,
  action,
}: {
  eyebrow: string;
  title: string;
  id: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--theme-primary)]">
          {eyebrow}
        </p>
        <h2 id={id} className="mt-1 text-2xl font-bold text-[var(--foreground)]">
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--theme-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
        >
          {action.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

function DocumentFlowCard({ document }: { document: DocumentListItem }) {
  const completed = document.status === "COMPLETED";
  const failed = document.status === "FAILED";

  return (
    <article className="flex h-full min-h-[280px] flex-col rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-5 shadow-[0_18px_50px_var(--theme-shadow)] transition duration-200 hover:-translate-y-1 hover:border-[var(--theme-primary)]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
          <FileText aria-hidden="true" className="size-5" />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            completed
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : failed
                ? "bg-red-500/10 text-red-700 dark:text-red-300"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {completed ? "Ready" : failed ? "Needs attention" : document.status}
        </span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-lg font-bold text-[var(--foreground)]">
        {stripExtension(document.filename)}
      </h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {formatDate(document.updated_at ?? document.created_at)}
        {document.page_count ? ` · ${document.page_count} pages` : ""}
      </p>

      {completed ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <ReadinessChip ready={document.summary_ready} label="Summary" />
          <ReadinessChip
            ready={document.flashcard_count > 0}
            label={`${document.flashcard_count} flashcards`}
          />
          <ReadinessChip ready={document.quiz_ready} label="Quiz" />
        </div>
      ) : failed ? (
        <p className="mt-5 text-sm leading-6 text-[var(--muted-foreground)]">
          Processing did not complete. Retry this document to rebuild its study
          materials.
        </p>
      ) : (
        <div aria-live="polite" className="mt-5">
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            StudFlow is processing this document. Refresh this page later to
            check whether your study materials are ready.
          </p>
          <div aria-hidden="true" className="mt-3 flex items-center gap-1.5">
            <span className="size-2 animate-pulse rounded-full bg-[var(--theme-primary)]" />
            <span className="size-2 animate-pulse rounded-full bg-[var(--theme-primary)] opacity-70" />
            <span className="size-2 animate-pulse rounded-full bg-[var(--theme-primary)] opacity-40" />
          </div>
        </div>
      )}

      <div className="mt-auto pt-5">
        {completed ? (
          <Link
            href={`/dashboard/study/${document.id}`}
            className={`${actionClass} w-full bg-[var(--theme-primary)] text-white`}
          >
            Continue studying
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : failed ? (
          <RetryDocumentButton documentId={document.id} />
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]">
            <Clock3 aria-hidden="true" className="size-4" />
            Processing now
          </span>
        )}
      </div>
    </article>
  );
}

function ReadinessChip({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--background)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
      {ready ? (
        <CheckCircle2 aria-hidden="true" className="size-3.5 text-emerald-600" />
      ) : (
        <Clock3 aria-hidden="true" className="size-3.5" />
      )}
      {label}
      <span className="sr-only">{ready ? " ready" : " not ready"}</span>
    </span>
  );
}

function EmptyDocuments() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--card)] p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--theme-soft)] text-[var(--theme-primary)]">
        <Plus aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-[var(--foreground)]">
        Build your first study flow
      </h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Upload notes, slides, or a PDF to generate grounded study materials.
      </p>
      <Link
        href="/dashboard/upload"
        className={`${actionClass} mt-5 bg-[var(--theme-primary)] text-white`}
      >
        Upload a document
      </Link>
    </div>
  );
}

function StatsGrid({ stats }: { stats: UserStats }) {
  const cards = [
    {
      label: "Documents",
      value: stats.total_documents,
      helper: "in your study library",
      icon: Library,
      tone: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Flashcards",
      value: stats.total_flashcards,
      helper: "ready for active recall",
      icon: Brain,
      tone: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Average quiz score",
      value: `${Math.round(stats.avg_quiz_score)}%`,
      helper: "across completed attempts",
      icon: Target,
      tone: "bg-emerald-500/10 text-emerald-600",
    },
  ];

  return (
    <section aria-labelledby="progress-heading" className="space-y-4">
      <SectionHeading
        eyebrow="Real progress"
        title="Your study snapshot"
        id="progress-heading"
      />
      <ul className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, helper, icon: Icon, tone }) => (
          <li
            key={label}
            className="rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-5 shadow-[0_18px_50px_var(--theme-shadow)]"
          >
            <div className={`grid size-11 place-items-center rounded-xl ${tone}`}>
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--muted-foreground)]">
              {label}
            </p>
            <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">
              {value}
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{helper}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewQueue({ queue }: { queue: UserQueue }) {
  return (
    <section
      aria-labelledby="queue-heading"
      className="rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-5 shadow-[0_18px_50px_var(--theme-shadow)] sm:p-6"
    >
      <SectionHeading
        eyebrow="Today’s focus"
        title="Review queue"
        id="queue-heading"
      />
      {queue.tasks.length > 0 ? (
        <ul className="mt-5 divide-y divide-[var(--theme-border)]">
          {queue.tasks.map((task, index) => {
            const isReview = task.badge === "Review";
            const href = isReview
              ? "/dashboard/flashcards"
              : "/dashboard/quizzes";
            return (
              <li
                key={`${task.title}-${index}`}
                className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    isReview
                      ? "bg-violet-500/10 text-violet-600"
                      : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {isReview ? (
                    <RotateCcw aria-hidden="true" className="size-5" />
                  ) : (
                    <Target aria-hidden="true" className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-[var(--foreground)]">
                      {task.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isReview
                          ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {task.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {task.subtitle}
                  </p>
                </div>
                <Link
                  href={href}
                  className={`${actionClass} border border-[var(--theme-border)] bg-[var(--background)] text-[var(--foreground)]`}
                >
                  Start
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl bg-emerald-500/10 p-5 text-center">
          <CheckCircle2
            aria-hidden="true"
            className="mx-auto size-7 text-emerald-600"
          />
          <h3 className="mt-2 font-bold text-[var(--foreground)]">
            You&apos;re caught up
          </h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            No flashcard reviews or quiz practice are waiting right now.
          </p>
        </div>
      )}
    </section>
  );
}

function StudyStreak({ stats }: { stats: UserStats }) {
  const days = getStreakDays(stats.streak_activity);
  return (
    <section
      aria-labelledby="streak-heading"
      className="rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-5 shadow-[0_18px_50px_var(--theme-shadow)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
            Consistency
          </p>
          <h2 id="streak-heading" className="mt-1 text-xl font-bold text-[var(--foreground)]">
            Study streak
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1.5 font-bold text-amber-700 dark:text-amber-300">
          <Flame aria-hidden="true" className="size-4" />
          {stats.streak_days} days
        </span>
      </div>
      <ol className="mt-5 grid grid-cols-7 gap-2">
        {days.map((day) => (
          <li key={day.key} className="text-center">
            <span
              aria-label={`${day.fullLabel}: ${day.active ? "study activity completed" : "no study activity"}`}
              className={`mx-auto grid size-8 place-items-center rounded-full border text-xs font-bold ${
                day.active
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-[var(--theme-border)] bg-[var(--background)] text-[var(--muted-foreground)]"
              }`}
            >
              {day.active ? "✓" : "·"}
            </span>
            <span className="mt-1 block text-[11px] font-semibold text-[var(--muted-foreground)]">
              {day.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function QuickActions() {
  const actions = [
    { href: "/dashboard/upload", label: "Upload document", icon: Upload },
    { href: "/dashboard/docs", label: "Browse documents", icon: FileText },
    {
      href: "/dashboard/flashcards",
      label: "Review flashcards",
      icon: Brain,
    },
    { href: "/dashboard/quizzes", label: "Practice quizzes", icon: BookOpen },
  ];
  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-5 shadow-[0_18px_50px_var(--theme-shadow)]"
    >
      <h2 id="quick-actions-heading" className="text-xl font-bold text-[var(--foreground)]">
        Quick actions
      </h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex min-h-12 items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)]">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="flex-1">{label}</span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getPrimaryAction(documents: DocumentListItem[], queue: UserQueue) {
  const firstTask = queue.tasks[0];
  if (firstTask) {
    return {
      href:
        firstTask.badge === "Review"
          ? "/dashboard/flashcards"
          : "/dashboard/quizzes",
      label: firstTask.badge === "Review" ? "Start today’s reviews" : "Practice a quiz",
    };
  }
  const completedDocument = documents.find(
    (document) => document.status === "COMPLETED",
  );
  if (completedDocument) {
    return {
      href: `/dashboard/study/${completedDocument.id}`,
      label: "Continue studying",
    };
  }
  return { href: "/dashboard/docs", label: "Browse documents" };
}

function getStreakDays(activity: boolean[]) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en", {
        weekday: "narrow",
        timeZone: "UTC",
      }).format(date),
      fullLabel: new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(date),
      active: activity[index] ?? false,
    };
  });
}

function stripExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
