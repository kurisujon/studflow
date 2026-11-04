import { Skeleton } from "@/components/ui/skeleton";
import { Loader2Icon as Loader2 } from "@/components/home/icon-registry";

export default function StudyWorkspaceLoading() {
  return (
    <div aria-hidden="true" className="flex w-full flex-1 flex-col gap-5 pb-10">
      {/* TOP BAR CARDS SKELETON */}
      <aside className="flex w-full flex-col gap-3">
        <Skeleton className="h-5 w-32 rounded" />

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-12">
          <section className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3.5 shadow-xs xl:col-span-4">
            <Skeleton className="h-3 w-20 rounded" />
            <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:col-span-5 xl:grid-cols-5">
            <section className="flex flex-col justify-between gap-2.5 rounded-2xl border border-border bg-card p-3.5 shadow-xs xl:col-span-2">
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-[54px] w-full rounded-xl" />
            </section>
            <section className="flex flex-col justify-between gap-2.5 rounded-2xl border border-border bg-card p-3.5 shadow-xs xl:col-span-3">
              <Skeleton className="h-3 w-16 rounded" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-[54px] w-full rounded-xl" />
                <Skeleton className="h-[54px] w-full rounded-xl" />
              </div>
            </section>
          </div>

          <section className="hidden flex-col justify-between gap-2.5 rounded-2xl border border-border bg-card p-3.5 shadow-xs md:flex xl:col-span-3">
            <Skeleton className="h-3 w-20 rounded" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </section>
        </div>
      </aside>

      {/* MAIN WORKSPACE SKELETON */}
      <section className="flex min-h-[480px] w-full min-w-0 flex-1 flex-col rounded-xl border border-border bg-card shadow-sm lg:rounded-2xl">
        <header className="flex items-center gap-3 rounded-t-xl border-b border-border px-4 py-3 lg:rounded-t-2xl lg:px-6 lg:py-4">
          <Skeleton className="size-4 lg:size-5 rounded-full" />
          <Skeleton className="h-5 w-32 lg:h-6 lg:w-40 rounded" />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <Loader2 className="mb-4 size-8 animate-spin text-muted-foreground opacity-50" />
          <Skeleton className="mb-2 h-5 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </section>

      <span className="sr-only">Loading study workspace...</span>
    </div>
  );
}
