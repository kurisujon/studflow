import { StudyWorkspace } from "@/components/study/StudyWorkspace";
import { fetchStudyDocument } from "@/lib/server-api";

type StudyPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function StudyPage({
  params,
  searchParams,
}: StudyPageProps) {
  const { id } = await params;
  const { tab = "summary" } = await searchParams;
  const document = await fetchStudyDocument(id);

  return (
    <section className="min-h-[calc(100dvh-var(--nav-height))] w-full bg-background">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <StudyWorkspace document={document} initialTab={tab} />
      </div>
    </section>
  );
}
