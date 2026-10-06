"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useEffectEvent } from "react";
import { useAuth } from "@clerk/nextjs";

import { API_BASE_URL, buildAPIError } from "@/lib/api";
import { useDocumentStatus } from "@/hooks/use-document-status";
import { DocumentProcessingStatus } from "@/components/document-processing-status";
import { UploadIcon, FileTextIcon, XIcon, AlertCircleIcon, Loader2Icon } from "@/components/home/icon-registry";

type UploadResponse = { document_id: string };

function isUploadResponse(payload: unknown): payload is UploadResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "document_id" in payload &&
    typeof (payload as UploadResponse).document_id === "string"
  );
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function UploadPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [documentId, setDocumentId] = useState<string | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [retryQueued, setRetryQueued] = useState(false);
  const hasRedirectedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: statusData,
    error: statusError,
    clearError: clearStatusError,
  } = useDocumentStatus(documentId, {
    enabled: documentId !== null && pollingEnabled,
  });

  const redirectToStudy = useEffectEvent((completedDocumentId: string) => {
    if (hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;
    startTransition(() => {
      router.replace(`/dashboard/study/${completedDocumentId}`);
    });
  });

  const handleTerminalStatus = useEffectEvent((status: "COMPLETED" | "FAILED", completedDocumentId?: string) => {
    if (status === "COMPLETED" && completedDocumentId) {
      setPollingEnabled(false);
      setIsUploading(false);
      redirectToStudy(completedDocumentId);
      return;
    }

    setPollingEnabled(false);
    setIsUploading(false);
    setRetryQueued(false);
    setError("Processing failed. Your file is saved and can be retried.");
  });

  useEffect(() => {
    if (!statusData) {
      return;
    }

    if (statusData.status === "COMPLETED") {
      const completedDocumentId = statusData.document_id;
      const timeoutId = window.setTimeout(() => {
        handleTerminalStatus("COMPLETED", completedDocumentId);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    if (statusData.status !== "FAILED") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handleTerminalStatus("FAILED");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusData]);

  useEffect(() => {
    if (
      !retryQueued ||
      !statusData ||
      statusData.status === "FAILED"
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRetryQueued(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [retryQueued, statusData]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setError(null);
    setRetryQueued(false);
    setIsUploading(true);

    try {
      const token = await getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw await buildAPIError(response, "Upload failed");
      }

      const payload = (await response.json()) as UploadResponse;

      if (!isUploadResponse(payload)) {
        throw new Error("Upload response was missing the document id.");
      }

      setDocumentId(payload.document_id);
      hasRedirectedRef.current = false;
      setPollingEnabled(true);
    } catch (submitError) {
      setIsUploading(false);
      setError(
        submitError instanceof Error ? submitError.message : "Upload failed.",
      );
    }
  }

  const handleClearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (documentId) {
    const isAwaitingRetryStatus =
      retryQueued && statusData?.status === "FAILED";

    return (
      <main className="flex min-h-[calc(100dvh-var(--nav-height))] flex-col items-center justify-center p-6 bg-[var(--background)]">
        <DocumentProcessingStatus
          status={statusData}
          error={error ?? statusError}
          retryDocumentId={documentId}
          retryQueued={isAwaitingRetryStatus}
          onRetrySuccess={() => {
            setError(null);
            clearStatusError();
            setRetryQueued(true);
            setIsUploading(true);
            setPollingEnabled(true);
          }}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-var(--nav-height))] flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-[640px]">
        {/* Header Section */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Add study material
          </h1>
          <p className="mt-2 text-base text-[var(--muted-foreground)]">
            Upload your lecture notes, syllabus, or reading assignment. Studflow will automatically generate flashcards and a quiz for you.
          </p>
        </div>

        {/* Upload Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8 flex flex-col gap-6"
        >
          {/* File Selection Surface */}
          <div className="flex flex-col gap-4">
            {!file ? (
              <label
                htmlFor="document-upload"
                className="group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] px-6 py-12 transition-colors hover:border-[var(--theme-primary)] hover:bg-[color-mix(in_srgb,var(--theme-primary)_2%,transparent)] focus-within:ring-2 focus-within:ring-[var(--theme-primary)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--card)]"
              >
                <div className="grid size-14 place-items-center rounded-2xl bg-[var(--theme-soft)] text-[var(--theme-primary)] group-hover:scale-105 transition-transform">
                  <UploadIcon aria-hidden="true" className="size-6" />
                </div>
                <div className="text-center">
                  <span className="block text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--theme-primary)] transition-colors">
                    Select a document to upload
                  </span>
                  <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                    Supported formats: PDF and DOCX
                  </span>
                </div>
                <input
                  id="document-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setError(null);
                  }}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="flex flex-1 items-center gap-3 overflow-hidden">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)]">
                    <FileTextIcon aria-hidden="true" className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {formatBytes(file.size)} &bull; {file.type.includes('pdf') ? 'PDF Document' : 'Word Document'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--muted)] px-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                    disabled={isUploading || isPending}
                    aria-label="Remove file"
                  >
                    <XIcon aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Validation Feedback */}
          {error ? (
            <div className="flex items-start gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-red-700 dark:text-red-400">
              <AlertCircleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : null}

          {/* Primary Action */}
          <button
            type="submit"
            disabled={!file || isUploading || isPending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-6 text-base font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
          >
            {isUploading || isPending ? (
              <>
                <Loader2Icon aria-hidden="true" className="size-5 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload and Process"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
