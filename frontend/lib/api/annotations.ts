import { API_BASE_URL, buildAPIError } from "@/lib/api";
import type {
  AIExplanation,
  AIContextSource,
  AIToolMode,
  Annotation,
  AnnotationColor,
  AnnotationType,
  UnderlineColor,
} from "@/types/annotations";

function isAIExplanation(payload: AIExplanation | { detail: string }): payload is AIExplanation {
  return (
    "selectedText" in payload &&
    "simplifiedExplanation" in payload &&
    "example" in payload &&
    "relatedTerms" in payload
  );
}

export async function askAIAboutSelection(
  documentId: string,
  selectedText: string,
  question: string,
  authToken: string | null,
  options?: {
    noteContent?: string;
    source?: AIContextSource;
    mode?: AIToolMode;
    signal?: AbortSignal;
  },
): Promise<AIExplanation> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/explain-selection`, {
    method: "POST",
    headers,
    signal: options?.signal,
    body: JSON.stringify({
      documentId,
      highlighted_text: selectedText,
      question,
      noteContent: options?.noteContent,
      source: options?.source ?? "selection",
      mode: options?.mode ?? "ask-ai",
    }),
  });

  if (!response.ok) {
    throw await buildAPIError(response, "AI explanation failed");
  }

  const payload = (await response.json()) as AIExplanation;

  if (!isAIExplanation(payload)) {
    throw new Error("AI response was missing explanation content.");
  }

  return payload;
}

export async function askAIAboutDocument(
  documentId: string,
  question: string,
  authToken: string | null,
  options?: {
    mode?: AIToolMode;
    signal?: AbortSignal;
  },
): Promise<AIExplanation> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/ask-ai`, {
    method: "POST",
    headers,
    signal: options?.signal,
    body: JSON.stringify({
      question,
      source: "general",
      mode: options?.mode ?? "ask-ai",
    }),
  });

  if (!response.ok) {
    throw await buildAPIError(response, "Document AI question failed");
  }

  const payload = (await response.json()) as AIExplanation;

  if (!isAIExplanation(payload)) {
    throw new Error("Document AI response was missing explanation content.");
  }

  return payload;
}

export async function getAnnotations(documentId: string, authToken: string | null): Promise<Annotation[]> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/annotations`, {
    headers,
  });

  if (!response.ok) throw await buildAPIError(response, "Failed to fetch annotations");
  return response.json();
}

export type CreateAnnotationPayload = {
  blockId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  type: AnnotationType;
  color?: AnnotationColor;
  underlineColor?: UnderlineColor;
  noteContent?: string;
};

export async function createAnnotation(documentId: string, payload: CreateAnnotationPayload, authToken: string | null): Promise<Annotation> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/annotations`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw await buildAPIError(response, "Failed to create annotation");
  return response.json();
}

export type UpdateAnnotationPayload = {
  color?: AnnotationColor;
  underlineColor?: UnderlineColor;
  noteContent?: string;
};

export async function updateAnnotation(annotationId: string, payload: UpdateAnnotationPayload, authToken: string | null): Promise<Annotation> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE_URL}/api/annotations/${annotationId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw await buildAPIError(response, "Failed to update annotation");
  return response.json();
}

export async function deleteAnnotation(annotationId: string, authToken: string | null): Promise<void> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE_URL}/api/annotations/${annotationId}`, {
    method: "DELETE",
    headers,
  });

  if (response.status === 404) {
    console.warn("Annotation already deleted", annotationId);
    return;
  }

  if (!response.ok) throw await buildAPIError(response, "Failed to delete annotation");
}
