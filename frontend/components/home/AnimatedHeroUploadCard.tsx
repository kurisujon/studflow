"use client";

import { motion, useReducedMotion } from "framer-motion";

import {
  SparklesIcon,
  UploadIcon,
} from "@/components/home/icon-registry";

const previewRows = [
  { label: "Laravel-Routes.pdf", status: "Uploaded", width: "100%" },
  { label: "Generating summary", status: "In progress", width: "72%" },
  { label: "Preparing flashcards", status: "Queued", width: "46%" },
] as const;

export function AnimatedHeroUploadCard() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        width: "100%",
        maxWidth: "560px",
        justifySelf: "center",
        padding: "1.45rem",
        borderRadius: "30px",
        border: "1px solid color-mix(in srgb, var(--theme-border) 68%, var(--border))",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--card) 96%, white), color-mix(in srgb, var(--card) 92%, var(--theme-soft)))",
        boxShadow: "0 24px 58px color-mix(in srgb, var(--theme-shadow) 84%, transparent)",
      }}
    >
      <div
        style={{
          padding: "1.1rem",
          borderRadius: "22px",
          border: "1px solid color-mix(in srgb, var(--theme-border) 60%, var(--border))",
          backgroundColor: "color-mix(in srgb, var(--card) 95%, var(--theme-soft))",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              width: "3rem",
              height: "3rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16px",
              backgroundColor: "var(--theme-soft)",
              border: "1px solid color-mix(in srgb, var(--theme-border) 76%, var(--border))",
              color: "var(--theme-primary)",
            }}
          >
            <UploadIcon size={18} strokeWidth={1.8} />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.42rem 0.7rem",
              borderRadius: "999px",
              backgroundColor: "color-mix(in srgb, var(--theme-soft) 88%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--theme-border) 75%, var(--border))",
              color: "var(--theme-primary)",
              fontSize: "0.78rem",
              fontWeight: 600,
            }}
          >
            <motion.span
              animate={reduceMotion ? undefined : { opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
              style={{ display: "inline-flex" }}
            >
              <SparklesIcon size={14} strokeWidth={1.8} />
            </motion.span>
            Mock processing preview
          </div>
        </div>

        <h2 style={{ fontSize: "1.45rem", marginBottom: "0.4rem" }}>Drop your study file here</h2>
        <p style={{ color: "var(--distill-text-secondary)", fontSize: "0.96rem", marginBottom: "1rem" }}>
          PDF and DOCX supported. One upload turns into a summary, flashcards, and quiz.
        </p>

        <div style={{ display: "grid", gap: "0.7rem" }}>
          {previewRows.map((item, index) => (
            <motion.div
              key={item.label}
              initial={reduceMotion ? undefined : { opacity: 0, x: 14 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.38, delay: reduceMotion ? 0 : index * 0.1, ease: "easeOut" }}
              style={{
                padding: "0.85rem 0.95rem",
                borderRadius: "18px",
                border: "1px solid color-mix(in srgb, var(--theme-border) 58%, var(--border))",
                backgroundColor: "var(--card)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  marginBottom: "0.65rem",
                }}
              >
                <p style={{ color: "var(--distill-text-primary)", fontWeight: 600, fontSize: "0.92rem" }}>
                  {item.label}
                </p>
                <span style={{ color: "var(--distill-text-muted)", fontSize: "0.8rem" }}>
                  {item.status}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "7px",
                  borderRadius: "999px",
                  overflow: "hidden",
                  backgroundColor: "color-mix(in srgb, var(--theme-soft) 72%, var(--border))",
                }}
              >
                <motion.div
                  initial={reduceMotion ? undefined : { width: 0 }}
                  animate={reduceMotion ? undefined : { width: item.width }}
                  transition={{ duration: 0.7, delay: reduceMotion ? 0 : index * 0.14, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    width: item.width,
                    background: "linear-gradient(90deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 55%, white))",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "0.75rem",
        }}
      >
        {[
          { label: "Summary", value: "1" },
          { label: "Flashcards", value: "15" },
          { label: "Quiz", value: "10" },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
            style={{
              padding: "0.85rem",
              borderRadius: "18px",
              border: "1px solid color-mix(in srgb, var(--theme-border) 58%, var(--border))",
              backgroundColor: "color-mix(in srgb, var(--card) 98%, white)",
            }}
          >
            <p style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>
              {item.label}
            </p>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--distill-text-primary)" }}>{item.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
