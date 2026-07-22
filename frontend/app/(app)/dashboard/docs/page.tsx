import { fetchDocuments } from "@/lib/server-api";
import { DocumentListView } from "@/components/document-list-view";

export default async function DocsPage() {
  const documents = await fetchDocuments();

  return <DocumentListView documents={documents} title="My Documents" targetTab="summary" />;
}
