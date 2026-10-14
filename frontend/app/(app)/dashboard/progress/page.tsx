import { BrainIcon, FileTextIcon, GaugeIcon, TargetIcon } from "@/components/home/icon-registry";
import { PageContainer, PageHeader, SectionHeading } from "@/components/dashboard/shared/PageHeader";
import { fetchDueFlashcards, fetchUserStats } from "@/lib/server-api";
import { getStreakDays } from "@/components/dashboard/overview/utils";

export default async function ProgressPage() {
  const [stats, dueCards] = await Promise.all([fetchUserStats(), fetchDueFlashcards()]);
  const metrics = [
    { label: "Materials", value: stats.total_documents, helper: "Uploaded documents", icon: FileTextIcon },
    { label: "Flashcards", value: stats.total_flashcards, helper: `${dueCards.length} currently due`, icon: BrainIcon },
    { label: "Average quiz score", value: `${Math.round(stats.avg_quiz_score)}%`, helper: "Across saved attempts", icon: TargetIcon },
    { label: "Quiz activity streak", value: `${stats.streak_days}d`, helper: "Based on recorded quiz activity", icon: GaugeIcon },
  ];
  const activityDays = getStreakDays(stats.streak_activity);
  return <PageContainer><PageHeader eyebrow="Verified learning data" title="My Progress" description="A clear view of the study totals and recent activity available from your account. Historical trends appear only when the underlying data exists." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Learning metrics">{metrics.map((metric) => { const Icon = metric.icon; return <article key={metric.label} className="bento-metric"><span className="bento-icon bento-icon-indigo"><Icon className="size-4.5" /></span><p className="mt-5 text-2xl font-bold tracking-tight text-foreground">{metric.value}</p><h2 className="mt-1 text-sm font-semibold text-foreground">{metric.label}</h2><p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p></article>; })}</section>
    <section className="space-y-4"><SectionHeading title="Last seven days" description="Recorded quiz activity for each day." /><div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="grid grid-cols-7 gap-2">{activityDays.map((day) => <div key={day.key} className="text-center"><div role="img" className={`mx-auto h-20 max-w-12 rounded-xl ${day.active ? "bg-[var(--theme-primary)]" : "bg-muted"}`} aria-label={`${day.fullLabel}: ${day.active ? "activity recorded" : "no activity recorded"}`} /><p className="mt-2 text-[11px] font-semibold text-muted-foreground">{day.label}</p></div>)}</div></div></section>
  </PageContainer>;
}
