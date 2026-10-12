import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return <div className="mx-auto w-full max-w-[1400px] space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-label="Loading workspace" role="status">
    <div className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-9 w-64 max-w-full" /><Skeleton className="h-4 w-[32rem] max-w-full" /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}</div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]"><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>
    <span className="sr-only">Loading StudFlow</span>
  </div>;
}
