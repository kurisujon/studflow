import type { UserStats } from "@/lib/types";

export function StatsGrid({ stats }: { stats: UserStats }) {
  const metrics = [
    {
      label: "Documents",
      value: stats.total_documents,
    },
    {
      label: "Flashcards",
      value: stats.total_flashcards,
    },
    {
      label: "Avg. Score",
      value: `${Math.round(stats.avg_quiz_score)}%`,
    },
    {
      label: "Day Streak",
      value: stats.streak_days,
    },
  ];

  return (
    <section aria-label="Your statistics" className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
      {metrics.map((metric, idx) => (
        <div key={metric.label} className={`flex flex-col ${idx !== 0 ? "sm:border-l sm:border-[var(--border)] sm:pl-8" : ""}`}>
          <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
            {metric.label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {metric.value}
          </p>
        </div>
      ))}
    </section>
  );
}
