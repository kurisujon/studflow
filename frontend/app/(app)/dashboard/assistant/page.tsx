import { DocumentLearningCard } from "@/components/dashboard/shared/DocumentLearningCard";
import { EmptyState } from "@/components/dashboard/shared/States";
import { PageContainer, PageHeader } from "@/components/dashboard/shared/PageHeader";
import { fetchDocuments } from "@/lib/server-api";

export default async function AssistantPage() {
  const documents = (await fetchDocuments()).filter((document) => document.status === "COMPLETED");
  return <PageContainer><PageHeader eyebrow="Source-grounded learning" title="AI Study Assistant" description="Choose a material to continue its persistent conversation. Answers stay scoped to that document and show verified source citations when evidence is available." />
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-soft)]/55 p-4 text-sm leading-6 text-foreground"><strong>Document scoped:</strong> StudFlow keeps each conversation connected to one material. Select the source you want to study before asking a question.</div>
    {documents.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{documents.map((document) => <DocumentLearningCard key={document.id} document={document} mode="assistant" />)}</div> : <EmptyState title="No ready materials" description="Upload a material and wait for processing to finish before starting a grounded conversation." />}
  </PageContainer>;
}
