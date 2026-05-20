"use client";

import { motion } from "framer-motion";

import type { DocumentStatusResponse } from "@/hooks/use-document-status";

const STAGE_COPY: Record<DocumentStatusResponse["processing_stage"], string> = {
  QUEUED: "Queueing your study workflow...",
  EXTRACTING_TEXT: "Extracting text and shaping the summary...",
  GENERATING_FLASHCARDS: "Generating flashcards for active recall...",
  GENERATING_QUIZ: "Building the quiz and explanations...",
  FINALIZING: "Finalizing your study set...",
  COMPLETED: "Study session ready.",
  FAILED: "Processing failed.",
};

export function DocumentProcessingStatus({
  status,
}: {
  status: DocumentStatusResponse | null;
}) {
  const message = status ? STAGE_COPY[status.processing_stage] : STAGE_COPY.QUEUED;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        width: "100%",
        maxWidth: "720px",
        marginInline: "auto",
        padding: "2rem",
        border: "1px solid var(--distill-border)",
        borderRadius: "24px",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(249,249,248,0.96))",
        boxShadow: "0 20px 60px rgba(17,17,16,0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      <motion.div
        initial={{ scaleX: 0.1 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{
          height: "3px",
          transformOrigin: "left center",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, var(--distill-text-primary), var(--distill-text-muted))",
          marginBottom: "1.5rem",
        }}
      />

      <p
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--distill-text-muted)",
          marginBottom: "0.75rem",
        }}
      >
        AI Processing
      </p>

      <h2
        style={{
          fontSize: "clamp(1.75rem, 3vw, 2.4rem)",
          marginBottom: "0.875rem",
        }}
      >
        {message}
      </h2>

      <p
        style={{
          fontSize: "1rem",
          color: "var(--distill-text-secondary)",
          marginBottom: "1.75rem",
        }}
      >
        Distill is turning the uploaded material into a summary, flashcards, and a quiz.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
        }}
      >
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
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              padding: "1rem 1rem 0.9rem",
              borderRadius: "18px",
              backgroundColor: "rgba(255,255,255,0.72)",
              border: "1px solid var(--distill-border)",
            }}
          >
            <p
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--distill-text-muted)",
                marginBottom: "0.45rem",
              }}
            >
              {item.label}
            </p>
            <p
              style={{
                fontSize: "0.98rem",
                color: "var(--distill-text-primary)",
              }}
            >
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
