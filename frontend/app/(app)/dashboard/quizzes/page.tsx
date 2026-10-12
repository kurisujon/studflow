import { DocumentLearningCard } from "@/components/dashboard/shared/DocumentLearningCard";
import { EmptyState } from "@/components/dashboard/shared/States";
import { PageContainer, PageHeader, SectionHeading } from "@/components/dashboard/shared/PageHeader";
import { ChallengeModeHub } from "@/components/study/ChallengeModeHub";
import { fetchDocuments, fetchMixedQuiz } from "@/lib/server-api";

export default async function QuizzesPage() {
  const [documents, quiz] = await Promise.all([fetchDocuments(), fetchMixedQuiz()]);
  const available = documents.filter((document) => document.status === "COMPLETED" && document.quiz_ready);
  return <PageContainer><PageHeader eyebrow="Practice" title="Practice & Quizzes" description="Practice one source with saved attempts, or start a mixed session assembled from your generated questions." />
    <section className="space-y-4"><SectionHeading title="Choose a material" description="Document quizzes save supported attempt history and weak-question results." />{available.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{available.map((document) => <DocumentLearningCard key={document.id} document={document} mode="quiz" />)}</div> : <EmptyState title="No quizzes ready" description="Upload a material to generate questions for focused practice." />}</section>
    <section className="space-y-4"><SectionHeading title="Mixed challenge" description="This combined practice session gives immediate feedback. Its result is session-only because mixed attempt persistence is not available." /><div className="rounded-2xl border border-border bg-card p-4 sm:p-6"><ChallengeModeHub questions={quiz} /></div></section>
  </PageContainer>;
}
