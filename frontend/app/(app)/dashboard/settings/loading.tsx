import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="relative min-h-[calc(100dvh-var(--nav-height))]">
      <div
        className="relative mx-auto w-full max-w-[1440px] space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        role="status"
        aria-label="Loading settings"
      >
        {/* Header */}
        <header className="relative flex min-w-0 items-start gap-4">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-32 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </header>

        {/* Settings Form Grid */}
        <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
          {/* Appearance Card */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
          </div>

          {/* Daily Goal Card */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
            <div className="mt-5 flex items-center gap-4 pt-2">
              <Skeleton className="h-2 flex-1 rounded-lg" />
              <Skeleton className="h-6 w-8" />
            </div>
          </div>

          {/* SM-2 Aggressiveness Card */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-full" />
            <div className="mt-5 flex items-center gap-4 pt-2">
              <Skeleton className="h-2 flex-1 rounded-lg" />
              <Skeleton className="h-6 w-8" />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4 lg:col-span-2">
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
        </div>

        <span className="sr-only">Loading Settings</span>
      </div>
    </div>
  );
}
