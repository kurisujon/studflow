import Link from "next/link";
import { RotateCcwIcon as RotateCcw, TargetIcon as Target, ArrowRightIcon as ArrowRight, CheckCircle2Icon as CheckCircle2 } from "@/components/home/icon-registry";
import type { UserQueue } from "@/lib/types";

export function ReviewQueue({ queue }: { queue: UserQueue }) {
  return (
    <section
      aria-labelledby="queue-heading"
      className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-1">
        <h2 id="queue-heading" className="text-xl font-bold text-[var(--foreground)]">
          Up next
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Your daily review tasks and recommended practice.
        </p>
      </div>

      {queue.tasks.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3">
          {queue.tasks.map((task, index) => {
            const isReview = task.badge === "Review";
            const href = isReview
              ? "/dashboard/flashcards"
              : "/dashboard/quizzes";
            return (
              <li
                key={`${task.title}-${index}`}
                className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] p-4 transition-colors hover:border-[var(--theme-primary)] hover:bg-[color-mix(in_srgb,var(--theme-primary)_3%,transparent)] sm:flex-row sm:items-center"
              >
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-xl ${
                    isReview
                      ? "bg-[var(--theme-soft)] text-[var(--theme-primary)]"
                      : "bg-[var(--theme-soft)] text-[var(--theme-primary)]"
                  }`}
                >
                  {isReview ? (
                    <RotateCcw aria-hidden="true" className="size-5.5" />
                  ) : (
                    <Target aria-hidden="true" className="size-5.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[var(--foreground)] group-hover:text-[var(--theme-primary)] transition-colors">
                      {task.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isReview
                          ? "bg-[var(--theme-primary)] text-white"
                          : "bg-[var(--theme-primary)] text-white"
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
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--theme-soft)] px-4 text-sm font-semibold text-[var(--theme-primary)] transition hover:bg-[var(--theme-primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                >
                  Start
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 aria-hidden="true" className="size-7" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-[var(--foreground)]">
            You&apos;re caught up!
          </h3>
          <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
            No flashcard reviews or quiz practice are waiting right now. Enjoy your free time or upload a new document to keep studying.
          </p>
        </div>
      )}
    </section>
  );
}
