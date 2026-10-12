import { DocumentLearningCard } from "@/components/dashboard/shared/DocumentLearningCard";
import { EmptyState } from "@/components/dashboard/shared/States";
import { PageContainer, PageHeader } from "@/components/dashboard/shared/PageHeader";
import { fetchDocuments } from "@/lib/server-api";

export default async function StudySetsPage() {
  const documents = await fetchDocuments();
  return <PageContainer><PageHeader eyebrow="Learning spaces" title="Study Sets" description="Each material is a focused learning space with its generated summary, flashcards, quiz, notes, and grounded AI conversation." action={{ href: "/upload", label: "New material" }} />
    {documents.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{documents.map((document) => <DocumentLearningCard key={document.id} document={document} />)}</div> : <EmptyState title="Create your first learning space" description="Upload a PDF or DOCX to generate a document-centered study set." />}
  </PageContainer>;
}
