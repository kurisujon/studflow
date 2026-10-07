import { Skeleton } from "@/components/ui/skeleton";
import { Loader2Icon as Loader2 } from "@/components/home/icon-registry";

export default function DashboardLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-8 pb-8">
      {/* Header Skeleton */}
      <Skeleton className="h-[140px] w-full rounded-[24px]" />

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (Documents + Stats) */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Documents Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
            </div>
            
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[260px] rounded-2xl" />
              ))}
            </ul>
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[104px] rounded-2xl" />
            ))}
          </section>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[280px] rounded-[24px]  flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground opacity-50" />
          </Skeleton>
          <Skeleton className="h-[160px] rounded-[24px]" />
          <Skeleton className="h-[260px] rounded-[24px]" />
        </div>
      </div>
      <span className="sr-only">Loading dashboard...</span>
    </div>
  );
}
