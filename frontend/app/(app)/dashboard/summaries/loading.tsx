import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";

export default function SummariesLoading() {
  return (
    <DashboardFeatureShell
      tone="summaries"
      eyebrow="Generated study notes"
      title="Summary library"
      description="Browse structured AI-generated overviews and return to the complete reader when you are ready to study."
    >
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full max-w-md rounded-xl bg-muted" />
          <div className="flex gap-4">
            <div className="h-10 w-32 rounded-lg bg-muted" />
            <div className="h-10 w-32 rounded-lg bg-muted" />
          </div>
        </div>
        <div className="mt-8 space-y-6">
          <div className="min-h-[250px] rounded-3xl border border-border bg-card p-6 shadow-[0_18px_50px_var(--theme-shadow)]" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[200px] rounded-2xl border border-border bg-background p-5"
              />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading summaries...</span>
    </DashboardFeatureShell>
  );
}
