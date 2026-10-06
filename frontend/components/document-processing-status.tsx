"use client";

import { motion } from "framer-motion";

import type { DocumentStatusResponse } from "@/hooks/use-document-status";
import { RetryDocumentButton } from "@/components/retry-document-button";
import { AlertCircleIcon, Loader2Icon, CheckCircle2Icon } from "@/components/home/icon-registry";

const STAGE_COPY: Record<DocumentStatusResponse["processing_stage"], string> = {
  QUEUED: "Queueing your study workflow...",
  EXTRACTING_TEXT: "Extracting text from your study file...",
  CHUNKING_DOCUMENT: "Organizing the document into study sections...",
  EMBEDDING_DOCUMENT: "Building the semantic search index...",
  ANALYZING_DOCUMENT: "Analyzing connected topics across the document...",
  GENERATING_STUDY_SET: "Generating your summary, flashcards, and quiz...",
  VALIDATING_STUDY_SET: "Checking the quality of your study set...",
  GENERATING_FLASHCARDS: "Generating flashcards for active recall...",
  GENERATING_QUIZ: "Building the quiz and explanations...",
  FINALIZING: "Finalizing your study set...",
  COMPLETED: "Study session ready.",
  FAILED: "Processing failed.",
};

export function DocumentProcessingStatus({
  status,
  error,
  retryDocumentId,
  retryQueued = false,
  onRetrySuccess,
}: {
  status: DocumentStatusResponse | null;
  error?: string | null;
  retryDocumentId?: string;
  retryQueued?: boolean;
  onRetrySuccess?: () => void;
}) {
  const isFailed = status?.status === "FAILED" && !retryQueued;
  const isCompleted = status?.status === "COMPLETED";
  const message = retryQueued
    ? "Retry queued."
    : status
      ? STAGE_COPY[status.processing_stage]
      : STAGE_COPY.QUEUED;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[720px] mx-auto overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-md"
    >
      {/* Progress Bar / Indicator Line */}
      {isFailed ? (
        <div className="h-1.5 w-full bg-red-500" />
      ) : isCompleted ? (
        <div className="h-1.5 w-full bg-emerald-500" />
      ) : (
        <motion.div
          initial={{ scaleX: 0.1 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: 1.6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="h-1.5 w-full origin-left bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-soft)]"
        />
      )}

      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {isFailed ? (
              <AlertCircleIcon className="size-5 text-red-500" aria-hidden="true" /> 
            ) : isCompleted ? (
              <CheckCircle2Icon className="size-5 text-emerald-500" aria-hidden="true" />
            ) : (
              <Loader2Icon className="size-5 animate-spin text-[var(--theme-primary)]" aria-hidden="true" /> 
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              {isFailed ? "Processing stopped" : isCompleted ? "Complete" : "AI Processing"}
            </p>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            {message}
          </h2>

          <p className="mt-3 text-base text-[var(--muted-foreground)]">
            {isFailed
              ? "Your file is still saved. Retry processing to resume from its existing checkpoints."
              : retryQueued
                ? "Studflow will resume this saved file from its existing checkpoints."
                : isCompleted
                  ? "Redirecting you to the study workspace..."
                  : "Studflow is turning the uploaded material into a summary, flashcards, and a quiz."}
          </p>
        </div>

        {error ? (
          <div className="mb-8 flex items-start gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-red-700 dark:text-red-400">
            <AlertCircleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Status",
              value: status?.status ?? "PENDING",
            },
            {
              label: "Stage",
              value: status?.processing_stage ?? "QUEUED",
            },
            {
              label: "Flashcards",
              value: status ? String(status.flashcard_count) : "0",
            },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.1 }}
              className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                {item.label}
              </p>
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                {item.value}
              </p>
            </motion.div>
          ))}
        </div>

        {isFailed && retryDocumentId ? (
          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <RetryDocumentButton
              documentId={retryDocumentId}
              onSuccess={onRetrySuccess}
            />
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
