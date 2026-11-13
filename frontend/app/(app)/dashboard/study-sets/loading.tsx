import { PageContainer, PageHeaderSkeleton } from "@/components/dashboard/shared/PageHeader";
import { DocumentGridSkeleton } from "@/components/dashboard/shared/DocumentLearningCard";

export default function StudySetsLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton
        hasEyebrow={true}
        hasAction={true}
        titleWidth="w-44"
        descWidth="w-[32rem]"
      />
      <DocumentGridSkeleton count={6} />
      <span className="sr-only">Loading Study Sets</span>
    </PageContainer>
  );
}
