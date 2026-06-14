"use client";

import { motion, useReducedMotion } from "framer-motion";

import {
  BotIcon,
  FileTextIcon,
  LayersIcon,
  PlayCircleIcon,
  SparklesIcon,
  StickyNoteIcon,
} from "@/components/home/icon-registry";

export function AnimatedStudyPreview() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      style={{
        padding: "1.25rem",
        borderRadius: "32px",
        border: "1px solid color-mix(in srgb, var(--theme-border) 65%, var(--border))",
        background:
          "radial-gradient(circle at top right, color-mix(in srgb, var(--theme-soft) 82%, transparent), transparent 34%), linear-gradient(180deg, color-mix(in srgb, var(--card) 95%, var(--theme-soft)), var(--card))",
        boxShadow: "0 22px 56px color-mix(in srgb, var(--theme-shadow) 80%, transparent)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            padding: "1.2rem",
            borderRadius: "24px",
            border: "1px solid color-mix(in srgb, var(--theme-border) 60%, var(--border))",
            backgroundColor: "color-mix(in srgb, var(--card) 96%, var(--theme-soft))",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.74rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--theme-primary)",
                  marginBottom: "0.3rem",
                }}
              >
                Summary
              </p>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--distill-text-muted)",
                }}
              >
                Biology review notes
              </p>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.7rem",
                borderRadius: "999px",
                border: "1px solid color-mix(in srgb, var(--theme-border) 75%, var(--border))",
                backgroundColor: "color-mix(in srgb, var(--theme-soft) 88%, var(--card))",
                color: "var(--theme-primary)",
                fontSize: "0.78rem",
                fontWeight: 500,
              }}
            >
              <FileTextIcon size={14} strokeWidth={1.8} />
              Key ideas
            </div>
          </div>

          <div style={{ display: "grid", gap: "0.8rem" }}>
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.38, delay: reduceMotion ? 0 : 0.06, ease: "easeOut" }}
              style={{
                padding: "0.95rem",
                borderRadius: "18px",
                backgroundColor: "var(--card)",
                border: "1px solid color-mix(in srgb, var(--theme-border) 55%, var(--border))",
              }}
            >
              <p style={{ fontSize: "0.95rem", color: "var(--distill-text-primary)" }}>
                Photosynthesis converts light energy into chemical energy stored
                in glucose.
              </p>
            </motion.div>

            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
              style={{
                padding: "1rem",
                borderRadius: "18px",
                backgroundColor: "color-mix(in srgb, var(--card) 96%, var(--theme-soft))",
                border: "1px solid color-mix(in srgb, var(--theme-border) 55%, var(--border))",
              }}
            >
              <p style={{ fontSize: "0.95rem", color: "var(--distill-text-secondary)" }}>
                Chlorophyll helps plants absorb light, and the{" "}
                <motion.span
                  animate={reduceMotion ? undefined : { boxShadow: ["inset 0 -0.45rem 0 rgba(254, 215, 170, 0.36)", "inset 0 -0.6rem 0 rgba(254, 215, 170, 0.58)", "inset 0 -0.45rem 0 rgba(254, 215, 170, 0.36)"] }}
                  transition={{ duration: 2.3, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
                  style={{
                    padding: "0.08rem 0.28rem",
                    borderRadius: "0.45rem",
                    backgroundColor: "color-mix(in srgb, var(--theme-soft) 88%, var(--card))",
                    color: "var(--distill-text-primary)",
                    display: "inline-flex",
                  }}
                >
                  light-dependent reactions
                </motion.span>{" "}
                start the energy transfer process.
              </p>

              <motion.div
                initial={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.26, delay: reduceMotion ? 0 : 0.34, ease: "easeOut" }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  marginTop: "0.8rem",
                }}
              >
                <span
                  style={{
                    width: "0.55rem",
                    height: "0.55rem",
                    borderRadius: "999px",
                    backgroundColor: "var(--theme-primary)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.8rem", color: "var(--distill-text-muted)" }}>
                  Note marker saved on this phrase
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
              style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.55rem 0.8rem",
                  borderRadius: "16px",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 65%, var(--border))",
                  backgroundColor: "var(--card)",
                  color: "var(--distill-text-primary)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                }}
              >
                <LayersIcon size={14} strokeWidth={1.8} />
                15 flashcards
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.55rem 0.8rem",
                  borderRadius: "16px",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 65%, var(--border))",
                  backgroundColor: "var(--card)",
                  color: "var(--distill-text-primary)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                }}
              >
                <SparklesIcon size={14} strokeWidth={1.8} />
                10-question quiz
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div style={{ display: "grid", gap: "1rem" }}>
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, x: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.36, delay: reduceMotion ? 0 : 0.14, ease: "easeOut" }}
            style={{
              padding: "1rem",
              borderRadius: "22px",
              border: "1px solid color-mix(in srgb, var(--theme-border) 60%, var(--border))",
              backgroundColor: "color-mix(in srgb, var(--card) 97%, var(--theme-soft))",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  color: "var(--theme-primary)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                }}
              >
                <BotIcon size={15} strokeWidth={1.8} />
                Ask AI
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--distill-text-muted)" }}>
                Mock preview
              </span>
            </div>

            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, x: 18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
              style={{
                maxWidth: "260px",
                marginLeft: "auto",
                padding: "0.8rem 0.9rem",
                borderRadius: "18px 18px 8px 18px",
                backgroundColor: "color-mix(in srgb, var(--theme-soft) 90%, var(--card))",
                border: "1px solid color-mix(in srgb, var(--theme-border) 70%, var(--border))",
                color: "var(--distill-text-primary)",
                fontSize: "0.88rem",
                marginBottom: "0.65rem",
              }}
            >
              What do light-dependent reactions do first?
            </motion.div>

            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, x: -18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.32, ease: "easeOut" }}
              style={{
                maxWidth: "280px",
                padding: "0.85rem 0.95rem",
                borderRadius: "18px 18px 18px 8px",
                backgroundColor: "var(--card)",
                border: "1px solid color-mix(in srgb, var(--theme-border) 55%, var(--border))",
                color: "var(--distill-text-secondary)",
                fontSize: "0.88rem",
              }}
            >
              They capture light energy and begin converting it into usable
              chemical energy for the plant.
            </motion.div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, x: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.36, delay: reduceMotion ? 0 : 0.36, ease: "easeOut" }}
            style={{
              padding: "1rem",
              borderRadius: "22px",
              border: "1px solid color-mix(in srgb, var(--theme-border) 60%, var(--border))",
              backgroundColor: "color-mix(in srgb, var(--card) 97%, var(--theme-soft))",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.7rem",
                marginBottom: "0.9rem",
              }}
            >
              <motion.div
                animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
                transition={{ duration: 2.2, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "14px",
                  backgroundColor: "color-mix(in srgb, var(--theme-soft) 88%, var(--card))",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 75%, var(--border))",
                  color: "var(--theme-primary)",
                  flexShrink: 0,
                }}
              >
                <StickyNoteIcon size={15} strokeWidth={1.8} />
              </motion.div>
              <div>
                <p style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--distill-text-primary)", marginBottom: "0.2rem" }}>
                  Note saved
                </p>
                <p style={{ fontSize: "0.84rem", color: "var(--distill-text-secondary)" }}>
                  Compare chlorophyll’s role with the Calvin cycle before the
                  next quiz attempt.
                </p>
              </div>
            </div>

            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32, delay: reduceMotion ? 0 : 0.46, ease: "easeOut" }}
              style={{
                padding: "0.95rem",
                borderRadius: "18px",
                border: "1px solid color-mix(in srgb, var(--theme-border) 60%, var(--border))",
                backgroundColor: "var(--card)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  marginBottom: "0.7rem",
                }}
              >
                <motion.div
                  animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.4, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
                  style={{
                    width: "3rem",
                    height: "2rem",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 18%, var(--theme-soft)), color-mix(in srgb, var(--theme-border) 70%, var(--card)))",
                    border: "1px solid color-mix(in srgb, var(--theme-border) 60%, var(--border))",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--theme-primary)",
                    flexShrink: 0,
                  }}
                >
                  <PlayCircleIcon size={15} strokeWidth={1.8} />
                </motion.div>
                <div>
                  <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--distill-text-primary)" }}>
                    Related video
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--distill-text-muted)" }}>
                    Photosynthesis in 8 minutes
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "0.82rem", color: "var(--distill-text-secondary)" }}>
                Watch without leaving the study page when you need a quicker
                explanation.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
