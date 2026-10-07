import { Skeleton } from "@/components/ui/skeleton";
import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";

export default function FlashcardsLoading() {
  return (
    <DashboardFeatureShell
      tone="flashcards"
      eyebrow="Spaced repetition"
      title="Daily review"
      description="Strengthen recall one card at a time. Your ratings update the existing review schedule."
    >
      <div aria-hidden="true" className="mx-auto mt-8 w-full max-w-4xl">
        <div className="min-h-[500px] flex flex-col justify-between rounded-[32px] border border-border bg-card p-6 shadow-[0_20px_60px_var(--theme-shadow)] sm:p-10 lg:p-12">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <div className="flex-1 my-10 flex flex-col justify-center items-center">
            <Skeleton className="h-8 w-3/4 rounded  mb-4" />
            <Skeleton className="h-8 w-1/2 rounded" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
      <span className="sr-only">Loading daily review...</span>
    </DashboardFeatureShell>
  );
}
