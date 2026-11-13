import { PageContainer, PageHeaderSkeleton, SectionHeading } from "@/components/dashboard/shared/PageHeader";
import { DocumentGridSkeleton } from "@/components/dashboard/shared/DocumentLearningCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function FlashcardsLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton
        hasEyebrow={true}
        hasAction={false}
        titleWidth="w-40"
        descWidth="w-[32rem]"
      />

      {/* Daily Review Queue Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-4 w-28 shrink-0" />
      </div>

      {/* Material Grid Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <DocumentGridSkeleton count={6} />
      </section>

      <span className="sr-only">Loading Flashcards</span>
    </PageContainer>
  );
}
