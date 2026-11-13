import { PageContainer, PageHeaderSkeleton } from "@/components/dashboard/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton
        hasEyebrow={true}
        hasAction={false}
        titleWidth="w-40"
        descWidth="w-[32rem]"
      />

      {/* 4 Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading metrics">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card p-5 shadow-[0_10px_26px_-24px_rgba(15,23,42,0.45)]"
          >
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="mt-5 h-8 w-20" />
            <Skeleton className="mt-2 h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-36" />
          </div>
        ))}
      </section>

      {/* Last Seven Days Activity Section */}
      <section className="space-y-4" aria-label="Loading weekly activity">
        <div className="space-y-1">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <Skeleton className="h-20 w-12 max-w-full rounded-xl" />
                <Skeleton className="mt-2 h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <span className="sr-only">Loading My Progress</span>
    </PageContainer>
  );
}
