"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { DocumentProcessingStatus } from "@/components/document-processing-status";
import { useDocumentStatus } from "@/hooks/use-document-status";
import { API_BASE_URL, buildAPIError } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

type UploadResponse = {
  document_id: string;
  status: string;
  file_url: string;
};

function isUploadResponse(payload: UploadResponse | { detail: string }): payload is UploadResponse {
  return "document_id" in payload;
}

export default function UploadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasRedirectedRef = useRef(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const { getToken } = useAuth();
  const { data: statusData } = useDocumentStatus(documentId, {
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
    setError("Processing failed. Please try another file or review extraction quality.");
  });

  useEffect(() => {
    if (statusData?.status === "COMPLETED") {
      handleTerminalStatus(statusData.status, statusData.document_id);
    }

    if (statusData?.status === "FAILED") {
      handleTerminalStatus(statusData.status);
    }
  }, [statusData]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a PDF or DOCX file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setError(null);
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

  if (documentId) {
    return (
      <section
        style={{
          minHeight: "calc(100dvh - var(--nav-height))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
          background:
            "radial-gradient(circle at top left, var(--theme-shadow), transparent 24%), linear-gradient(180deg, var(--background), color-mix(in srgb, var(--background) 82%, var(--theme-soft)))",
        }}
      >
        <DocumentProcessingStatus status={statusData} />
      </section>
    );
  }

  return (
    <section
      style={{
        minHeight: "calc(100dvh - var(--nav-height))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background:
          "radial-gradient(circle at top left, var(--theme-shadow), transparent 24%), linear-gradient(180deg, var(--background), color-mix(in srgb, var(--background) 82%, var(--theme-soft)))",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "640px",
          border: "1px solid var(--theme-border)",
          borderRadius: "24px",
          padding: "2rem",
          background: "color-mix(in srgb, var(--card) 92%, var(--theme-soft))",
          boxShadow: "0 22px 64px var(--theme-shadow)",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--theme-primary)",
            marginBottom: "0.75rem",
          }}
        >
          Upload
        </p>

        <h1
          style={{
            marginBottom: "0.75rem",
          }}
        >
          Start a new study workflow.
        </h1>

        <p
          style={{
            marginBottom: "1.5rem",
          }}
        >
          Upload one PDF or DOCX. Studflow will process it asynchronously.
        </p>

        <label
          htmlFor="document-upload"
          style={{
            display: "block",
            padding: "1.5rem",
            borderRadius: "20px",
            border: "1px dashed var(--theme-border)",
            backgroundColor: "var(--card)",
            marginBottom: "1rem",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "0.92rem",
              color: "var(--distill-text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            {file ? file.name : "Choose a PDF or DOCX file"}
          </span>
          <span
            style={{
              fontSize: "0.86rem",
              color: "var(--distill-text-secondary)",
            }}
          >
            PDF and DOCX supported.
          </span>
        </label>

        <input
          id="document-upload"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
          }}
          style={{
            marginBottom: "1.25rem",
            width: "100%",
          }}
        />

        {error ? (
          <p
            style={{
              marginBottom: "1rem",
              color: "#b42318",
              fontSize: "0.92rem",
            }}
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn-primary"
          disabled={isPending || isUploading}
          style={{
            minHeight: "42px",
            paddingInline: "18px",
            borderRadius: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          {isUploading || isPending ? (
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "999px",
                border: "2px solid rgba(255,255,255,0.35)",
                borderTopColor: "#ffffff",
                display: "inline-block",
                animation: "distillSpin 0.8s linear infinite",
              }}
            />
          ) : null}
          {isUploading || isPending ? "Uploading..." : "Upload and Process"}
        </button>
      </form>
    </section>
  );
}
