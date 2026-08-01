"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { API_BASE_URL, buildAPIError } from "@/lib/api";

type DeleteDocumentButtonProps = {
  documentId: string;
  filename: string;
  onSuccess?: (documentId: string) => void;
};

export function DeleteDocumentButton({
  documentId,
  filename,
  onSuccess,
}: DeleteDocumentButtonProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    confirmRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendingRef.current) {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [open]);

  async function handleDelete() {
    if (isPending) return;
    setIsPending(true);
    pendingRef.current = true;
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw await buildAPIError(response, "Delete failed");
      }
      setOpen(false);
      onSuccess?.(documentId);
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Document could not be deleted. Please try again.",
      );
    } finally {
      setIsPending(false);
      pendingRef.current = false;
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setError(null); setOpen(true); }}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-300 bg-transparent px-4 text-sm font-semibold text-red-700 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-800 dark:text-red-300"
      >
        Delete document
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="presentation">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-document-${documentId}`}
            aria-describedby={`delete-document-description-${documentId}`}
            className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-6 shadow-2xl"
          >
            <h2 id={`delete-document-${documentId}`} className="text-xl font-bold text-[var(--foreground)]">
              Delete “{filename}”?
            </h2>
            <p id={`delete-document-description-${documentId}`} className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
              This permanently removes the original file, summary, flashcards, quiz, notes, and study history. This action cannot be undone.
            </p>
            {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4 text-sm font-semibold text-[var(--foreground)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                type="button"
                disabled={isPending}
                onClick={() => void handleDelete()}
                className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
