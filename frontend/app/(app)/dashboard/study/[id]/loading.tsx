import { Skeleton } from "@/components/ui/skeleton";
import { Loader2Icon as Loader2 } from "@/components/home/icon-registry";

export default function StudyWorkspaceLoading() {
  return (
    <div aria-hidden="true" className="flex w-full flex-1 flex-col gap-5 pb-10 lg:flex-row lg:items-start lg:gap-8">
      {/* MATERIAL CONTEXT + STUDY TOOLS SKELETON */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-6 lg:w-64 xl:w-72">
        {/* Back link placeholder */}
        <Skeleton className="h-5 w-32 rounded" />

        {/* Active source skeleton */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm lg:p-5 flex flex-col gap-3">
          <Skeleton className="h-3 w-16 rounded  mb-1" />
          <div className="flex items-start gap-3">
            <Skeleton className="flex size-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2 mt-1">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </section>

        {/* Study tools skeleton */}
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 shadow-sm lg:flex-col lg:p-2">
          {/* Tool Group 1 */}
          <div className="contents lg:block">
            <Skeleton className="hidden h-3 w-20 rounded  lg:block mx-2 mt-3 mb-2" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="shrink-0 rounded-lg h-9 w-24 lg:w-full lg:h-10  mb-1 mx-1 lg:mx-0" />
            ))}
          </div>
        </nav>
      </aside>

      {/* MAIN WORKSPACE SKELETON */}
      <section className="flex min-h-[480px] w-full min-w-0 flex-1 flex-col rounded-xl border border-border bg-card shadow-sm lg:rounded-2xl">
        {/* Workspace Header Skeleton */}
        <header className="flex items-center gap-3 rounded-t-xl border-b border-border px-4 py-3 lg:rounded-t-2xl lg:px-6 lg:py-4">
          <Skeleton className="size-4 lg:size-5 rounded-full" />
          <Skeleton className="h-5 w-32 lg:h-6 lg:w-40 rounded" />
        </header>

        {/* Main Content Skeleton (Loading State) */}
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <Loader2 className="size-8 animate-spin text-muted-foreground opacity-50 mb-4" />
          <Skeleton className="h-5 w-48 rounded  mb-2" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </section>
      
      <span className="sr-only">Loading study workspace...</span>
    </div>
  );
}
