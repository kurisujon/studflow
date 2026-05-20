import { API_BASE_URL } from "@/lib/api";
import type { DocumentListItem, StudyDocument } from "@/lib/types";

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  return (await response.json()) as T;
}

export function fetchDocuments(): Promise<DocumentListItem[]> {
  return fetchJSON<DocumentListItem[]>("/api/documents");
}

export function fetchStudyDocument(id: string): Promise<StudyDocument> {
  return fetchJSON<StudyDocument>(`/api/documents/${id}/study`);
}
