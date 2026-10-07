import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";

export default function QuizzesLoading() {
  return (
    <DashboardFeatureShell
      tone="quizzes"
      eyebrow="Challenge mode"
      title="Test what you know"
      description="Work through a mixed set of generated questions and get immediate feedback after every answer."
    >
      <div aria-hidden="true" className="mx-auto mt-8 w-full max-w-3xl animate-pulse motion-reduce:animate-none">
        <div className="flex justify-between items-center mb-6">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-2 w-48 rounded-full bg-muted" />
        </div>
        <div className="min-h-[400px] flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_var(--theme-shadow)] sm:p-8 lg:p-10">
          <div className="space-y-4">
            <div className="h-6 w-full rounded bg-muted" />
            <div className="h-6 w-5/6 rounded bg-muted" />
          </div>
          <div className="mt-10 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-full rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading challenge mode...</span>
    </DashboardFeatureShell>
  );
}
