import Link from "next/link";
import { DocumentLearningCard } from "@/components/dashboard/shared/DocumentLearningCard";
import { EmptyState } from "@/components/dashboard/shared/States";
import { PageContainer, PageHeader, SectionHeading } from "@/components/dashboard/shared/PageHeader";
import { CalendarCheckIcon } from "@/components/home/icon-registry";
import { fetchDocuments, fetchDueFlashcards } from "@/lib/server-api";

export default async function FlashcardsPage() {
  const [documents, due] = await Promise.all([fetchDocuments(), fetchDueFlashcards()]);
  const available = documents.filter((document) => document.status === "COMPLETED" && document.flashcard_count > 0);
  return <PageContainer><PageHeader eyebrow="Active recall" title="Flashcards" description="Choose a material for a focused card session, or continue the cards scheduled by spaced repetition." />
    <Link href="/dashboard/review" className="study-interactive-card flex flex-col gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-soft)] p-5 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--theme-primary)] text-[var(--theme-on-primary)]"><CalendarCheckIcon className="size-5" /></span><span className="min-w-0 flex-1"><strong className="block text-base text-foreground">Daily review queue</strong><span className="mt-1 block text-sm text-muted-foreground">{due.length ? `${due.length} card${due.length === 1 ? " is" : "s are"} due now.` : "You are caught up for now."}</span></span><span className="text-sm font-semibold text-[var(--theme-primary)]">Open review →</span></Link>
    <section className="space-y-4"><SectionHeading title="Study by material" description="Sessions here preserve the generated card order for each document." />{available.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{available.map((document) => <DocumentLearningCard key={document.id} document={document} mode="flashcards" />)}</div> : <EmptyState title="No flashcard sets yet" description="Upload a learning material to generate your first set of flashcards." />}</section>
  </PageContainer>;
}
