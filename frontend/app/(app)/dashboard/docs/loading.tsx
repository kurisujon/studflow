import { PageContainer, PageHeaderSkeleton } from "@/components/dashboard/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocsLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton
        hasEyebrow={true}
        hasAction={true}
        titleWidth="w-40"
        descWidth="w-[28rem]"
      />

      {/* Library Controls Toolbar */}
      <section className="rounded-2xl border border-border bg-card p-3 sm:p-4" aria-label="Loading library controls">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full flex-1 rounded-xl" />
          <div className="grid min-w-0 grid-cols-2 gap-1 sm:flex">
            <Skeleton className="h-10 w-16 rounded-xl" />
            <Skeleton className="h-10 w-20 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-18 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
          <div className="flex rounded-xl border border-border bg-background p-1 gap-1">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Document List */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border" aria-label="Loading documents">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="sm:w-28">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-16 rounded-lg" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
          </div>
        ))}
      </section>

      <span className="sr-only">Loading My Library</span>
    </PageContainer>
  );
}
