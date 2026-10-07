import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";

export default function DocsLoading() {
  return (
    <DashboardFeatureShell
      tone="documents"
      eyebrow="Study library"
      title="Your study library"
      description="Organize uploaded materials and see exactly which learning tools are ready."
    >
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full max-w-sm rounded-xl bg-muted" />
          <div className="h-10 w-full sm:w-48 rounded-xl bg-muted" />
        </div>
        <div className="mt-8">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_18px_50px_var(--theme-shadow)] sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="h-7 w-48 rounded bg-muted" />
              <div className="h-5 w-64 rounded bg-muted" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex min-h-[300px] flex-col rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="size-11 rounded-xl bg-muted" />
                    <div className="h-6 w-20 rounded-full bg-muted" />
                  </div>
                  <div className="mt-4 h-6 w-3/4 rounded bg-muted" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                  <div className="mt-auto pt-5 space-y-3">
                    <div className="h-10 w-full rounded-lg bg-muted" />
                    <div className="h-11 w-full rounded-xl bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading study library...</span>
    </DashboardFeatureShell>
  );
}
