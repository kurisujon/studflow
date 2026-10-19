import { DocumentLearningCard } from "@/components/dashboard/shared/DocumentLearningCard";
import { EmptyState } from "@/components/dashboard/shared/States";
import { PageContainer, PageHeader } from "@/components/dashboard/shared/PageHeader";
import { fetchDocuments } from "@/lib/server-api";

export default async function AssistantPage() {
  const documents = (await fetchDocuments()).filter((document) => document.status === "COMPLETED");
  return <PageContainer><PageHeader eyebrow="Evidence-aware learning" title="AI Study Assistant" description="Choose a material for a persistent tutoring conversation. StudFlow cites document-supported claims and can also teach established concepts with clearly labeled general explanations and examples." />
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-soft)]/55 p-4 text-sm leading-6 text-foreground"><strong>Document connected:</strong> Each conversation stays connected to one material. Ask about its contents, request a worked example, or learn the broader concept; source-specific claims remain citation-verified.</div>
    {documents.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{documents.map((document) => <DocumentLearningCard key={document.id} document={document} mode="assistant" />)}</div> : <EmptyState title="No ready materials" description="Upload a material and wait for processing to finish before starting a grounded conversation." />}
  </PageContainer>;
}
