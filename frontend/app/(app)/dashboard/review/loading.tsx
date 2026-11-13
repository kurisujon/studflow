import { PageContainer, PageHeaderSkeleton } from "@/components/dashboard/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewLoading() {
  return (
    <PageContainer width="reading">
      <PageHeaderSkeleton
        hasEyebrow={true}
        hasAction={false}
        hasAside={true}
        titleWidth="w-40"
        descWidth="w-[30rem]"
      />

      <section className="space-y-4" aria-label="Loading review stage">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2 w-48 rounded-full" />
        </div>
        <Skeleton className="h-4 w-72 max-w-full" />

        {/* Flip Card Stage */}
        <div className="flex min-h-[400px] w-full flex-col justify-between rounded-[28px] border border-border bg-card p-8 shadow-sm">
          <Skeleton className="h-3 w-24" />
          <div className="my-auto space-y-3 text-center">
            <Skeleton className="mx-auto h-7 w-3/4 max-w-md" />
            <Skeleton className="mx-auto h-5 w-1/2 max-w-xs" />
          </div>
          <Skeleton className="mx-auto h-4 w-32" />
        </div>

        {/* 4 Rating Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </section>

      <span className="sr-only">Loading Daily Review</span>
    </PageContainer>
  );
}
