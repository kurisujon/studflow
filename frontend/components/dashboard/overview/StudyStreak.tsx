import { FlameIcon as Flame } from "@/components/home/icon-registry";
import type { UserStats } from "@/lib/types";
import { getStreakDays } from "./utils";

export function StudyStreak({ stats }: { stats: UserStats }) {
  const days = getStreakDays(stats.streak_activity);
  
  return (
    <section
      aria-labelledby="streak-heading"
      className="flex flex-col rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="streak-heading" className="text-lg font-bold text-[var(--foreground)]">
            Study Streak
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Your consistency over the last 7 days.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-400">
          <Flame aria-hidden="true" className="size-4" />
          {stats.streak_days} days
        </span>
      </div>
      
      <ol className="mt-6 grid grid-cols-7 gap-2">
        {days.map((day) => (
          <li key={day.key} className="flex flex-col items-center gap-2">
            <span
              aria-label={`${day.fullLabel}: ${day.active ? "study activity completed" : "no study activity"}`}
              className={`grid size-8 place-items-center rounded-full border text-xs font-bold transition-colors ${
                day.active
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]"
              }`}
            >
              {day.active ? "✓" : ""}
            </span>
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              {day.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
