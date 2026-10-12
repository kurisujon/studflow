import { Skeleton } from "@/components/ui/skeleton";

export function RouteLoading({ cards = 6 }: { cards?: number }) {
  return <div className="mx-auto w-full max-w-[1400px] space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-label="Loading page" role="status">
    <div className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-9 w-72 max-w-full" /><Skeleton className="h-4 w-[36rem] max-w-full" /></div>
    <Skeleton className="h-16 rounded-2xl" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: cards }, (_, index) => <Skeleton key={index} className="h-52 rounded-2xl" />)}</div>
    <span className="sr-only">Loading StudFlow page</span>
  </div>;
}
