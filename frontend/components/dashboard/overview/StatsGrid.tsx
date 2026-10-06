import { FolderOpenIcon as FolderOpen, LayersIcon as Layers, TargetIcon as Target, TrophyIcon as Trophy } from "@/components/home/icon-registry";
import type { UserStats } from "@/lib/types";

export function StatsGrid({ stats }: { stats: UserStats }) {
  const metrics = [
    {
      label: "Documents",
      value: stats.total_documents,
      icon: FolderOpen,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Flashcards",
      value: stats.total_flashcards,
      icon: Layers,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Avg. Quiz Score",
      value: `${Math.round(stats.avg_quiz_score)}%`,
      icon: Target,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Day Streak",
      value: stats.streak_days,
      icon: Trophy,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <section aria-label="Your statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5"
          >
            <span
              className={`grid size-12 shrink-0 place-items-center rounded-xl ${metric.bg} ${metric.color}`}
            >
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--muted-foreground)]">
                {metric.label}
              </p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {metric.value}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
