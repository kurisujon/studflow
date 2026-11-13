import { PageContainer, PageHeaderSkeleton } from "@/components/dashboard/shared/PageHeader";
import { DocumentGridSkeleton } from "@/components/dashboard/shared/DocumentLearningCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizzesLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton
        hasEyebrow={true}
        hasAction={false}
        titleWidth="w-52"
        descWidth="w-[34rem]"
      />

      {/* Section 1: Choose a material */}
      <section className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <DocumentGridSkeleton count={3} />
      </section>

      {/* Section 2: Mixed challenge */}
      <section className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4 max-w-md" />
          <div className="grid gap-3 pt-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </section>

      <span className="sr-only">Loading Practice & Quizzes</span>
    </PageContainer>
  );
}
