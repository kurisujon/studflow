import { Skeleton } from "@/components/ui/skeleton";

export default function UploadLoading() {
  return (
    <section
      className="flex min-h-[calc(100dvh-var(--nav-height))] flex-col items-center justify-center p-4 sm:p-6 bg-[var(--background)]"
      role="status"
      aria-label="Loading upload page"
    >
      <div className="w-full max-w-[640px] space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center sm:text-left">
          <Skeleton className="h-9 w-48 max-w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Upload Form Card */}
        <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm sm:p-8 space-y-6">
          <div className="rounded-xl border border-dashed border-border bg-background p-12 flex flex-col items-center justify-center gap-4">
            <Skeleton className="size-14 rounded-2xl" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>

      <span className="sr-only">Loading upload material</span>
    </section>
  );
}
