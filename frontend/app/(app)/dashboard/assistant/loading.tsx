import { PageContainer, PageHeaderSkeleton } from "@/components/dashboard/shared/PageHeader";
import { DocumentGridSkeleton } from "@/components/dashboard/shared/DocumentLearningCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssistantLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton
        hasEyebrow={true}
        hasAction={false}
        titleWidth="w-56"
        descWidth="w-[36rem]"
      />
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-4 w-2/3 max-w-xl" />
      </div>
      <DocumentGridSkeleton count={6} hasAssistantBadge={true} />
      <span className="sr-only">Loading AI Study Assistant</span>
    </PageContainer>
  );
}
