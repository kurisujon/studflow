import { Skeleton } from "@/components/ui/skeleton";
import { Loader2Icon as Loader2 } from "@/components/home/icon-registry";

export default function DashboardLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-10 pb-12">
      {/* Top section: Header + Stats Grid */}
      <div className="flex flex-col gap-8 border-b border-[var(--border)] pb-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-3 w-full max-w-2xl">
            <Skeleton className="h-8 w-3/4 max-w-[400px] rounded" />
            <Skeleton className="h-5 w-full max-w-[500px] rounded" />
          </div>
          <div className="flex shrink-0 items-center gap-3 w-full md:w-auto">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Typographic Stats */}
        <section className="flex flex-wrap items-center gap-6 sm:gap-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
        </section>
      </div>

      {/* Main Grid Layout (Bento) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Large Left Card */}
        <div className="lg:col-span-2">
          <Skeleton className="h-full min-h-[320px] rounded-[24px]" />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[280px] rounded-[24px] flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground opacity-50" />
          </Skeleton>
          <Skeleton className="h-[160px] rounded-[24px]" />
        </div>
      </div>

      {/* Recent Materials */}
      <section className="flex flex-col gap-4 pt-4">
        <Skeleton className="h-5 w-32 rounded ml-2" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </section>

      <span className="sr-only">Loading dashboard...</span>
    </div>
  );
}
