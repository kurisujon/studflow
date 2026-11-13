import { Skeleton } from "@/components/ui/skeleton";

export default function SummariesLoading() {
  return (
    <div className="relative min-h-[calc(100dvh-var(--nav-height))]">
      <div
        className="relative mx-auto w-full max-w-[1440px] space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        role="status"
        aria-label="Loading summary library"
      >
        {/* Header */}
        <header className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-8 w-52 max-w-full" />
              <Skeleton className="h-4 w-[32rem] max-w-full" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </header>

        <div className="space-y-6">
          {/* Featured Summary Card */}
          <article className="rounded-xl border border-border bg-card p-5 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
              <div className="space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-72 max-w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-6 w-14 rounded-md" />
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl border border-border bg-background/50 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-1 h-5 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-1 h-5 w-10" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-1 h-5 w-12" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </article>

          {/* Summary Toolbar */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-10 w-36 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
            <div className="flex justify-between border-t border-border pt-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-16" />
            </div>
          </section>

          {/* Summary Row List */}
          <ul className="flex flex-col rounded-xl border border-border bg-card divide-y divide-border">
            {Array.from({ length: 4 }).map((_, index) => (
              <li
                key={index}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-60 max-w-full" />
                  <Skeleton className="h-4 w-full max-w-lg" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-9 w-28 shrink-0 rounded-xl" />
              </li>
            ))}
          </ul>
        </div>

        <span className="sr-only">Loading Summary library</span>
      </div>
    </div>
  );
}
