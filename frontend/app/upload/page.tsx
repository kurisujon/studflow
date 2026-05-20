"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { DocumentProcessingStatus } from "@/components/document-processing-status";
import { useDocumentStatus } from "@/hooks/use-document-status";
import { API_BASE_URL } from "@/lib/api";

type UploadResponse = {
  document_id: string;
  status: string;
  file_url: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasRedirectedRef = useRef(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);
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

  useEffect(() => {
    if (statusData?.status === "COMPLETED") {
      setPollingEnabled(false);
      redirectToStudy(statusData.document_id);
    }

    if (statusData?.status === "FAILED") {
      setPollingEnabled(false);
      setError("Processing failed. Please try another file or review extraction quality.");
    }
  }, [redirectToStudy, statusData]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a PDF or DOCX file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as UploadResponse | { detail: string };

      if (!response.ok) {
        throw new Error("detail" in payload ? payload.detail : "Upload failed.");
      }

      setDocumentId(payload.document_id);
      hasRedirectedRef.current = false;
      setPollingEnabled(true);
    } catch (submitError) {
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
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "640px",
          border: "1px solid var(--distill-border)",
          borderRadius: "24px",
          padding: "2rem",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(249,249,248,0.96))",
          boxShadow: "0 22px 64px rgba(17,17,16,0.06)",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--distill-text-muted)",
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
          Upload one PDF or DOCX. Distill will process it asynchronously.
        </p>

        <label
          htmlFor="document-upload"
          style={{
            display: "block",
            padding: "1.5rem",
            borderRadius: "20px",
            border: "1px dashed var(--distill-border)",
            backgroundColor: "rgba(255,255,255,0.7)",
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
          disabled={isPending}
          style={{
            minHeight: "42px",
            paddingInline: "18px",
            borderRadius: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          {isPending ? (
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
          {isPending ? "Submitting..." : "Upload and Process"}
        </button>
      </form>
    </section>
  );
}
