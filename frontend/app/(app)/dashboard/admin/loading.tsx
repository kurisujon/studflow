import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"
      role="status"
      aria-label="Loading user management"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* 5 Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`rounded-2xl border border-border bg-card p-4 shadow-2xs ${
              index === 4 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-9 w-full sm:w-72 rounded-xl" />
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
        <div className="border-b border-border bg-muted/40 p-4">
          <div className="grid grid-cols-5 gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-5 items-center gap-4 p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-4 w-28 max-w-full" />
                  <Skeleton className="h-3 w-36 max-w-full" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-3 w-24" />
              <div className="flex justify-end gap-2">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading User Management</span>
    </div>
  );
}
