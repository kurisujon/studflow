"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@clerk/nextjs";

import { API_BASE_URL, buildAPIError } from "@/lib/api";

type RetryDocumentButtonProps = {
  documentId: string;
  onSuccess?: () => void;
};

export function RetryDocumentButton({
  documentId,
  onSuccess,
}: RetryDocumentButtonProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const token = await getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/documents/${documentId}/retry`,
        {
          method: "POST",
          headers,
        },
      );

      if (!response.ok) {
        throw await buildAPIError(response, "Retry failed");
      }

      onSuccess?.();
      router.refresh();
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : "Retry could not be started. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.65rem" }}>
      <button
        type="button"
        className="btn-primary"
        disabled={isPending}
        onClick={() => void handleRetry()}
        style={{
          minHeight: "42px",
          paddingInline: "18px",
          borderRadius: "12px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
        }}
      >
        {isPending ? (
          <span
            aria-hidden="true"
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
        {isPending ? "Retrying..." : "Retry processing"}
      </button>

      {error ? (
        <p role="alert" style={{ color: "#b42318", fontSize: "0.86rem" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
