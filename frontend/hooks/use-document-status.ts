"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { API_BASE_URL, buildAPIError } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

export type DocumentStatusResponse = {
  document_id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  processing_stage:
    | "QUEUED"
    | "EXTRACTING_TEXT"
    | "GENERATING_FLASHCARDS"
    | "GENERATING_QUIZ"
    | "FINALIZING"
    | "COMPLETED"
    | "FAILED";
  page_count: number | null;
  summary_ready: boolean;
  flashcard_count: number;
  quiz_ready: boolean;
};

type UseDocumentStatusOptions = {
  enabled?: boolean;
  intervalMs?: number;
};

export function useDocumentStatus(
  documentId: string | null,
  options: UseDocumentStatusOptions = {},
) {
  const { enabled = true, intervalMs = 3000 } = options;
  const [data, setData] = useState<DocumentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getToken } = useAuth();

  const fetchStatus = useEffectEvent(async () => {
    if (!documentId || !enabled) {
      return;
    }

    setIsLoading(true);

    try {
      const token = await getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/documents/${documentId}/status`,
        {
          cache: "no-store",
          headers,
        },
      );

      if (!response.ok) {
        throw await buildAPIError(response, "Failed to fetch document status");
      }

      const payload =
        (await response.json()) as DocumentStatusResponse;
      setData(payload);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to fetch document status.",
      );
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (!documentId || !enabled) {
      return;
    }

    const initialFetchTimeoutId = window.setTimeout(() => {
      void fetchStatus();
    }, 0);

    const intervalId = window.setInterval(() => {
      void fetchStatus();
    }, intervalMs);

    return () => {
      window.clearTimeout(initialFetchTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [documentId, enabled, intervalMs]);

  return {
    data,
    error,
    isLoading,
  };
}
