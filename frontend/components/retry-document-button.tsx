"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL, buildAPIError } from "@/lib/api";
import { Loader2Icon, AlertCircleIcon } from "@/components/home/icon-registry";

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
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => void handleRetry()}
        className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
      >
        {isPending ? (
          <>
            <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
            Retrying...
          </>
        ) : (
          "Retry processing"
        )}
      </button>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-red-700 dark:text-red-400">
          <AlertCircleIcon aria-hidden="true" className="size-4 shrink-0 mt-0.5" />
          <p role="alert" className="text-xs font-medium">
            {error}
          </p>
        </div>
      ) : null}
    </div>
  );
}
