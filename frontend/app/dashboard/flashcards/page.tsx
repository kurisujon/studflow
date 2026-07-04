import { fetchDocuments } from "@/lib/server-api";
import { DocumentListView } from "@/components/document-list-view";

export default async function FlashcardsPage() {
  const documents = await fetchDocuments();

  return <DocumentListView documents={documents} title="Flashcards" targetTab="flashcards" />;
}
