import { Skeleton } from "@/components/ui/skeleton";
import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";

export default function QuizzesLoading() {
  return (
    <DashboardFeatureShell
      tone="quizzes"
      eyebrow="Challenge mode"
      title="Test what you know"
      description="Work through a mixed set of generated questions and get immediate feedback after every answer."
    >
      <div aria-hidden="true" className="mx-auto mt-8 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-2 w-48 rounded-full" />
        </div>
        <div className="min-h-[400px] flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_var(--theme-shadow)] sm:p-8 lg:p-10">
          <div className="space-y-4">
            <Skeleton className="h-6 w-full rounded" />
            <Skeleton className="h-6 w-5/6 rounded" />
          </div>
          <div className="mt-10 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading challenge mode...</span>
    </DashboardFeatureShell>
  );
}
