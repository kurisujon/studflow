import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";

export default function FlashcardsLoading() {
  return (
    <DashboardFeatureShell
      tone="flashcards"
      eyebrow="Spaced repetition"
      title="Daily review"
      description="Strengthen recall one card at a time. Your ratings update the existing review schedule."
    >
      <div aria-hidden="true" className="mx-auto mt-8 w-full max-w-4xl animate-pulse motion-reduce:animate-none">
        <div className="min-h-[500px] flex flex-col justify-between rounded-[32px] border border-border bg-card p-6 shadow-[0_20px_60px_var(--theme-shadow)] sm:p-10 lg:p-12">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
          <div className="flex-1 my-10 flex flex-col justify-center items-center">
            <div className="h-8 w-3/4 rounded bg-muted mb-4" />
            <div className="h-8 w-1/2 rounded bg-muted" />
          </div>
          <div className="h-14 w-full rounded-2xl bg-muted" />
        </div>
      </div>
      <span className="sr-only">Loading daily review...</span>
    </DashboardFeatureShell>
  );
}
