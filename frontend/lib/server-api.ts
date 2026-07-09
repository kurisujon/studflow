import { API_BASE_URL, readAPIErrorDetail } from "@/lib/api";
import type { DocumentListItem, StudyDocument } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function fetchJSON<T>(path: string): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    const detail = await readAPIErrorDetail(response);

    if (response.status === 401 || response.status === 403) {
      redirect("/sign-in");
    }

    throw new Error(
      `Request failed for ${path}: ${response.status} ${detail}`,
    );
  }

  return (await response.json()) as T;
}

export function fetchDocuments(): Promise<DocumentListItem[]> {
  return fetchJSON<DocumentListItem[]>("/api/documents");
}

export function fetchStudyDocument(id: string): Promise<StudyDocument> {
  return fetchJSON<StudyDocument>(`/api/documents/${id}/study`);
}

export function fetchDueFlashcards(): Promise<StudyFlashcard[]> {
  return fetchJSON<StudyFlashcard[]>("/api/study/flashcards/due");
}

export async function reviewFlashcard(
  id: string,
  rating: "again" | "hard" | "good" | "easy",
): Promise<StudyFlashcard> {
  const { getToken } = await auth();
  const token = await getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/study/flashcards/${id}/review`, {
    method: "POST",
    headers,
    body: JSON.stringify({ rating }),
  });

  if (!response.ok) {
    const detail = await readAPIErrorDetail(response);
    if (response.status === 401 || response.status === 403) {
      redirect("/sign-in");
    }
    throw new Error(`Review failed: ${response.status} ${detail}`);
  }

  return (await response.json()) as StudyFlashcard;
}
