"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

type IconProps = {
  size?: number;
  strokeWidth?: number;
};

function FileTextIcon({ size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function UploadIcon({ size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V5m0 0-4 4m4-4 4 4M5 16.5v1.25A1.25 1.25 0 0 0 6.25 19h11.5A1.25 1.25 0 0 0 19 17.75V16.5" />
    </svg>
  );
}

function LayersIcon({ size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5" />
      <path d="m4 16.5 8 4.5 8-4.5" />
    </svg>
  );
}

function SparklesIcon({ size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
      <path d="M5 17l.9 2.1L8 20l-2.1.9L5 23l-.9-2.1L2 20l2.1-.9L5 17Z" />
      <path d="M19 13l1.1 2.4L22.5 16l-2.4 1.1L19 19.5l-1.1-2.4L15.5 16l2.4-1.1L19 13Z" />
    </svg>
  );
}

function StickyNoteIcon({ size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4h14a2 2 0 0 1 2 2v9l-5 5H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M16 20v-4a1 1 0 0 1 1-1h4" />
    </svg>
  );
}

function FolderIcon({ size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
    </svg>
  );
}

function BotIcon({ size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="8" width="14" height="11" rx="3" />
      <path d="M12 4v4" />
      <path d="M9 13h.01" />
      <path d="M15 13h.01" />
      <path d="M9 16h6" />
    </svg>
  );
}

function PlayCircleIcon({ size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SUPPORTED_FORMATS = ["PDF", "DOCX"] as const;
const UPCOMING_FORMATS = ["PPT soon", "TXT soon"] as const;

const HERO_CHIPS = [
  { label: "1 summary", icon: FileTextIcon },
  { label: "15 flashcards", icon: LayersIcon },
  { label: "10-question quiz", icon: SparklesIcon },
] as const;

const WORKFLOW_STEPS = [
  {
    id: "upload",
    eyebrow: "Step 01",
    title: "Upload your source material",
    description: "Drop a PDF or DOCX and keep the starting point clear for first-time students.",
    icon: UploadIcon,
    detail: "Supports PDF and DOCX only, on purpose.",
  },
  {
    id: "generate",
    eyebrow: "Step 02",
    title: "Generate the study set",
    description: "Studflow extracts the document and prepares a summary, flashcards, and quiz around the same source.",
    icon: SparklesIcon,
    detail: "Structured output instead of generic AI text.",
  },
  {
    id: "study",
    eyebrow: "Step 03",
    title: "Study in one calm workspace",
    description: "Read, annotate, retry quiz mistakes, save AI flashcards, and ask grounded document questions without losing context.",
    icon: BotIcon,
    detail: "Built around active review, not passive scrolling.",
  },
] as const;

const FEATURE_BENTO = [
  {
    title: "Concise summary",
    description: "See the document’s core ideas first, then move into active recall when you are ready.",
    icon: FileTextIcon,
    tone: "warm",
    size: "wide",
    points: ["overview", "topics", "key terms"],
  },
  {
    title: "Flashcards tied to the source",
    description: "Generated flashcards stay attached to the document, and AI suggestions can be saved directly into the deck.",
    icon: LayersIcon,
    tone: "paper",
    size: "standard",
    points: ["generated cards", "AI save"],
  },
  {
    title: "Quiz with retry flow",
    description: "Track attempts, review missed questions, and retry only what you got wrong.",
    icon: SparklesIcon,
    tone: "mint",
    size: "standard",
    points: ["attempt history", "retry missed"],
  },
  {
    title: "Ask AI with real document context",
    description: "Ask about selected text, notes, or the full uploaded document with grounded chunk references.",
    icon: BotIcon,
    tone: "lavender",
    size: "tall",
    points: ["selection explain", "document Q&A", "source chunks"],
  },
  {
    title: "Notes and highlights that stay useful",
    description: "Mark important passages and return to the same context later instead of losing your place.",
    icon: StickyNoteIcon,
    tone: "paper",
    size: "standard",
    points: ["saved notes", "jump back"],
  },
  {
    title: "Related videos inside the same flow",
    description: "Watch supporting videos without leaving the study workspace when the text needs reinforcement.",
    icon: PlayCircleIcon,
    tone: "warm",
    size: "wide",
    points: ["embedded support", "no tab hopping"],
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "What file types does Studflow support?",
    answer: "Studflow currently supports PDF and DOCX files only.",
  },
  {
    question: "Does Studflow replace studying?",
    answer: "No. It improves review quality, but you still need to understand and practice the material.",
  },
  {
    question: "Can I ask AI about the whole document?",
    answer: "Yes. You can ask about selected text, saved notes, or the full uploaded document.",
  },
  {
    question: "Can I retry missed quiz questions only?",
    answer: "Yes. Studflow stores quiz attempts and lets you retry missed questions from the latest result or saved history.",
  },
  {
    question: "Can I save AI answers into flashcards?",
    answer: "Yes. Suggested flashcards from the AI panel can be saved into the current document’s flashcard set.",
  },
] as const;

function sectionHeading(eyebrow: string, title: string, description: string) {
  return (
    <div style={{ maxWidth: "760px", marginBottom: "1.5rem" }}>
      <p
        style={{
          fontSize: "0.78rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--theme-primary)",
          marginBottom: "0.65rem",
        }}
      >
        {eyebrow}
      </p>
      <h2 style={{ marginBottom: "0.65rem" }}>{title}</h2>
      <p style={{ fontSize: "1rem", color: "var(--distill-text-secondary)" }}>{description}</p>
    </div>
  );
}

function HeroUploadPreview() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        width: "100%",
        maxWidth: "560px",
        justifySelf: "center",
        padding: "1.4rem",
        borderRadius: "30px",
        border: "1px solid color-mix(in srgb, var(--theme-border) 70%, var(--border))",
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
          <span
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
            <SparklesIcon size={14} strokeWidth={1.8} />
            Processing flow
          </span>
        </div>

        <h2 style={{ fontSize: "1.45rem", marginBottom: "0.4rem" }}>Drop your study file here</h2>
        <p style={{ color: "var(--distill-text-secondary)", fontSize: "0.96rem", marginBottom: "1rem" }}>
          PDF and DOCX supported. One upload turns into a summary, flashcards, and quiz.
        </p>

        <div style={{ display: "grid", gap: "0.7rem" }}>
          {[
            { label: "Laravel-Routes.pdf", status: "Uploaded", width: "100%" },
            { label: "Generating summary", status: "In progress", width: "74%" },
            { label: "Preparing flashcards", status: "Queued", width: "38%" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={reduceMotion ? undefined : { opacity: 0, x: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : index * 0.08, ease: "easeOut" }}
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
                  transition={{ duration: 0.6, delay: reduceMotion ? 0 : index * 0.1, ease: "easeOut" }}
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
          <div
            key={item.label}
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
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function WorkflowTimeline() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
      }}
    >
      {WORKFLOW_STEPS.map(({ id, eyebrow, title, description, icon: Icon, detail }, index) => (
        <motion.article
          key={id}
          initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.08, ease: "easeOut" }}
          style={{
            position: "relative",
            padding: "1.35rem",
            borderRadius: "24px",
            border: "1px solid color-mix(in srgb, var(--theme-border) 65%, var(--border))",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--card) 97%, white), color-mix(in srgb, var(--card) 92%, var(--theme-soft)))",
            boxShadow: "0 14px 34px color-mix(in srgb, var(--theme-shadow) 56%, transparent)",
          }}
        >
          <div
            style={{
              width: "3rem",
              height: "3rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "18px",
              marginBottom: "1rem",
              backgroundColor: "color-mix(in srgb, var(--theme-soft) 88%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--theme-border) 74%, var(--border))",
              color: "var(--theme-primary)",
            }}
          >
            <Icon size={17} strokeWidth={1.8} />
          </div>
          <p className="study-meta-label" style={{ marginBottom: "0.55rem" }}>{eyebrow}</p>
          <h3 style={{ fontSize: "1.08rem", marginBottom: "0.55rem" }}>{title}</h3>
          <p style={{ fontSize: "0.95rem", color: "var(--distill-text-secondary)", marginBottom: "0.9rem" }}>
            {description}
          </p>
          <p style={{ fontSize: "0.84rem", color: "var(--distill-text-muted)" }}>{detail}</p>
          {!reduceMotion ? (
            <motion.span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "1.1rem",
                right: "1.1rem",
                width: "0.55rem",
                height: "0.55rem",
                borderRadius: "999px",
                backgroundColor: "var(--theme-primary)",
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.55, 1, 0.55] }}
              transition={{ repeat: Infinity, duration: 2.2, delay: index * 0.18, ease: "easeInOut" }}
            />
          ) : null}
        </motion.article>
      ))}
    </div>
  );
}

function FeatureBento() {
  const reduceMotion = useReducedMotion();

  function toneToStyles(tone: (typeof FEATURE_BENTO)[number]["tone"]) {
    if (tone === "mint") {
      return {
        background: "linear-gradient(180deg, color-mix(in srgb, #eef8f1 86%, var(--card)), var(--card))",
      };
    }
    if (tone === "lavender") {
      return {
        background: "linear-gradient(180deg, color-mix(in srgb, #f3f1fb 82%, var(--card)), var(--card))",
      };
    }
    if (tone === "warm") {
      return {
        background: "linear-gradient(180deg, color-mix(in srgb, var(--theme-soft) 92%, var(--card)), var(--card))",
      };
    }

    return {
      background: "linear-gradient(180deg, color-mix(in srgb, var(--card) 98%, white), var(--card))",
    };
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1rem",
      }}
    >
      {FEATURE_BENTO.map(({ title, description, icon: Icon, points, size, tone }, index) => (
        <motion.article
          key={title}
          initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.38, delay: reduceMotion ? 0 : index * 0.05, ease: "easeOut" }}
          whileHover={reduceMotion ? undefined : { y: -3 }}
          style={{
            padding: "1.35rem",
            borderRadius: "26px",
            border: "1px solid color-mix(in srgb, var(--theme-border) 62%, var(--border))",
            boxShadow: "0 14px 34px color-mix(in srgb, var(--theme-shadow) 56%, transparent)",
            minHeight: size === "tall" ? "320px" : size === "wide" ? "250px" : "220px",
            gridColumn: size === "wide" ? "span 2" : undefined,
            display: "grid",
            gap: "1rem",
            alignContent: "space-between",
            ...toneToStyles(tone),
          }}
        >
          <div>
            <div
              style={{
                width: "2.9rem",
                height: "2.9rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "18px",
                marginBottom: "1rem",
                border: "1px solid color-mix(in srgb, var(--theme-border) 75%, var(--border))",
                backgroundColor: "color-mix(in srgb, var(--card) 92%, white)",
                color: "var(--theme-primary)",
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <h3 style={{ fontSize: "1.08rem", marginBottom: "0.55rem" }}>{title}</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--distill-text-secondary)", lineHeight: 1.65 }}>
              {description}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
            {points.map((point) => (
              <span
                key={point}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.45rem 0.75rem",
                  borderRadius: "999px",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 70%, var(--border))",
                  backgroundColor: "color-mix(in srgb, var(--card) 94%, white)",
                  color: "var(--distill-text-primary)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
              >
                {point}
              </span>
            ))}
          </div>
        </motion.article>
      ))}
    </div>
  );
}

function DashboardPreviewStrip() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      style={{
        padding: "1.35rem",
        borderRadius: "30px",
        border: "1px solid color-mix(in srgb, var(--theme-border) 65%, var(--border))",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--card) 97%, white), color-mix(in srgb, var(--card) 92%, var(--theme-soft)))",
        boxShadow: "0 18px 46px color-mix(in srgb, var(--theme-shadow) 78%, transparent)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: "1rem",
        }}
      >
        <div
          style={{
            padding: "1rem",
            borderRadius: "22px",
            backgroundColor: "color-mix(in srgb, var(--card) 96%, var(--theme-soft))",
            border: "1px solid color-mix(in srgb, var(--theme-border) 60%, var(--border))",
          }}
        >
          <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
            Dashboard Preview
          </p>
          <h3 style={{ marginBottom: "0.45rem" }}>A calmer place to continue studying</h3>
          <p style={{ color: "var(--distill-text-secondary)", marginBottom: "1rem", fontSize: "0.95rem" }}>
            Instead of a blank list, the dashboard can surface what is ready to review and where to continue next.
          </p>

          <div style={{ display: "grid", gap: "0.8rem" }}>
            {[
              { label: "Ready to review", value: "3 documents", icon: FolderIcon },
              { label: "Latest quiz", value: "Retry missed questions", icon: SparklesIcon },
              { label: "Last note", value: "Reopen saved highlights", icon: StickyNoteIcon },
            ].map(({ label, value, icon: Icon }) => (
              <motion.div
                key={label}
                initial={reduceMotion ? undefined : { opacity: 0, x: 16 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  padding: "0.9rem 1rem",
                  borderRadius: "18px",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 58%, var(--border))",
                  backgroundColor: "var(--card)",
                }}
              >
                <div
                  style={{
                    width: "2.55rem",
                    height: "2.55rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "16px",
                    border: "1px solid color-mix(in srgb, var(--theme-border) 74%, var(--border))",
                    backgroundColor: "color-mix(in srgb, var(--theme-soft) 86%, var(--card))",
                    color: "var(--theme-primary)",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", marginBottom: "0.18rem" }}>
                    {label}
                  </p>
                  <p style={{ color: "var(--distill-text-primary)", fontWeight: 600 }}>{value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          <div
            style={{
              padding: "1rem",
              borderRadius: "22px",
              border: "1px solid color-mix(in srgb, var(--theme-border) 58%, var(--border))",
              backgroundColor: "color-mix(in srgb, var(--card) 98%, white)",
            }}
          >
            <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
              Useful Widgets
            </p>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {[
                { label: "Documents", value: "6" },
                { label: "Flashcards", value: "90" },
                { label: "Quiz status", value: "2 retries pending" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "0.85rem 0.95rem",
                    borderRadius: "18px",
                    border: "1px solid color-mix(in srgb, var(--theme-border) 58%, var(--border))",
                    backgroundColor: "color-mix(in srgb, var(--card) 97%, white)",
                  }}
                >
                  <p style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-foreground)", marginBottom: "0.18rem" }}>
                    {item.label}
                  </p>
                  <p style={{ color: "var(--distill-text-primary)", fontWeight: 700 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "1rem",
              borderRadius: "22px",
              border: "1px dashed color-mix(in srgb, var(--theme-border) 68%, var(--border))",
              backgroundColor: "color-mix(in srgb, var(--theme-soft) 82%, var(--card))",
            }}
          >
            <p className="study-meta-label" style={{ marginBottom: "0.4rem" }}>
              Empty State
            </p>
            <p style={{ color: "var(--distill-text-primary)", fontWeight: 600, marginBottom: "0.3rem" }}>
              No study documents yet
            </p>
            <p style={{ color: "var(--distill-text-secondary)", fontSize: "0.92rem" }}>
              The dashboard should guide the user back to upload, not leave a plain blank card.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspacePreviewMock() {
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
        <div
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

          <div
            style={{
              display: "grid",
              gap: "0.8rem",
            }}
          >
            <div
              style={{
                padding: "0.95rem",
                borderRadius: "18px",
                backgroundColor: "var(--card)",
                border: "1px solid color-mix(in srgb, var(--theme-border) 55%, var(--border))",
              }}
            >
              <p style={{ fontSize: "0.95rem", color: "var(--distill-text-primary)" }}>
                Photosynthesis converts light energy into chemical energy stored in glucose.
              </p>
            </div>

            <div
              style={{
                padding: "1rem",
                borderRadius: "18px",
                backgroundColor: "color-mix(in srgb, var(--card) 96%, var(--theme-soft))",
                border: "1px solid color-mix(in srgb, var(--theme-border) 55%, var(--border))",
              }}
            >
              <p style={{ fontSize: "0.95rem", color: "var(--distill-text-secondary)" }}>
                Chlorophyll helps plants absorb light, and the{" "}
                <span
                  style={{
                    padding: "0.08rem 0.28rem",
                    borderRadius: "0.45rem",
                    backgroundColor: "color-mix(in srgb, var(--theme-soft) 88%, var(--card))",
                    color: "var(--distill-text-primary)",
                    boxShadow: "inset 0 -0.45rem 0 color-mix(in srgb, var(--theme-border) 55%, transparent)",
                  }}
                >
                  light-dependent reactions
                </span>{" "}
                start the energy transfer process.
              </p>

              <div
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
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
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
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div
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

            <div
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
            </div>

            <div
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
              They capture light energy and begin converting it into usable chemical energy for the plant.
            </div>
          </div>

          <div
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
              <div
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
              </div>
              <div>
                <p style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--distill-text-primary)", marginBottom: "0.2rem" }}>
                  Note saved
                </p>
                <p style={{ fontSize: "0.84rem", color: "var(--distill-text-secondary)" }}>
                  Compare chlorophyll’s role with the Calvin cycle before the next quiz attempt.
                </p>
              </div>
            </div>

            <div
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
                <div
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
                </div>
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
                Watch without leaving the study page when you need a quicker explanation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100dvh - var(--nav-height))",
        padding: "4rem 1.5rem",
      }}
    >
      <div className="container" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        <div
          style={{
            display: "grid",
            gap: "2rem",
            alignItems: "center",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{ textAlign: "left" }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "0.25rem 0.875rem",
                borderRadius: "99px",
                border: "1px solid var(--distill-border)",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--distill-text-muted)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "1.75rem",
              }}
            >
              Powered by Gemini AI
            </span>

            <h1 style={{ maxWidth: "720px", marginBottom: "1.25rem" }}>
              Turn any document into a{" "}
              <span style={{ color: "var(--distill-text-muted)" }}>
                calmer study workflow.
              </span>
            </h1>

            <p
              style={{
                maxWidth: "580px",
                fontSize: "1.0625rem",
                marginBottom: "2rem",
                color: "var(--distill-text-secondary)",
              }}
            >
              Upload a PDF or DOCX. Studflow turns it into a concise summary,
              flashcards, quiz history, saved notes, and grounded AI help in one
              focused study flow.
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                marginBottom: "2.25rem",
              }}
            >
              <Link href="/upload" className="btn-primary" id="hero-upload-cta">
                Upload a Document
              </Link>
              <Link href="/dashboard" className="btn-ghost" id="hero-dashboard-link">
                View Dashboard
              </Link>
            </div>

            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              {HERO_CHIPS.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.45rem 0.8rem",
                    borderRadius: "999px",
                    border: "1px solid color-mix(in srgb, var(--theme-border) 68%, var(--border))",
                    backgroundColor: "color-mix(in srgb, var(--card) 92%, var(--theme-soft))",
                    color: "var(--distill-text-primary)",
                    fontSize: "0.84rem",
                    fontWeight: 500,
                  }}
                >
                  <Icon size={14} strokeWidth={1.8} />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          <Link href="/dashboard/upload" aria-label="Go to upload page" style={{ display: "block", width: "100%" }}>
            <HeroUploadPreview />
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", paddingTop: "0.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              flexWrap: "wrap",
            }}
          >
            {SUPPORTED_FORMATS.map((label) => (
              <span
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "999px",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 70%, var(--border))",
                  backgroundColor: "color-mix(in srgb, var(--card) 90%, var(--theme-soft))",
                  color: "var(--distill-text-primary)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
              >
                {label}
              </span>
            ))}
            {UPCOMING_FORMATS.map((label) => (
              <span
                key={label}
                aria-disabled="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "999px",
                  border: "1px dashed var(--distill-border)",
                  backgroundColor: "color-mix(in srgb, var(--background) 92%, var(--card))",
                  color: "var(--distill-text-muted)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <p style={{ fontSize: "0.92rem", color: "var(--distill-text-secondary)" }}>
            Supports PDF and DOCX. More formats can wait until the current study flow is stronger.
          </p>
        </div>

        <section aria-labelledby="homepage-workflow-title" style={{ paddingTop: "1.25rem" }}>
          {sectionHeading(
            "Workflow",
            "A study flow with motion that actually explains the product",
            "Studflow should feel alive because the product is moving, not because the page is overloaded with decoration.",
          )}
          <WorkflowTimeline />
        </section>

        <section aria-labelledby="homepage-features-title" style={{ paddingTop: "1.25rem" }}>
          {sectionHeading(
            "Study Outputs",
            "The main capabilities deserve a stronger product layout",
            "The homepage should show the shape of the workflow clearly: summary first, active recall next, AI and notes as support.",
          )}
          <FeatureBento />
        </section>

        <section aria-labelledby="homepage-workspace-preview-title" style={{ paddingTop: "1.25rem" }}>
          {sectionHeading(
            "Study Workspace",
            "See the study environment before you upload",
            "The preview stays product-accurate: summary, highlights, AI help, saved notes, flashcards, quiz, and related videos.",
          )}
          <WorkspacePreviewMock />
        </section>

        <section aria-labelledby="homepage-dashboard-preview-title" style={{ paddingTop: "1.25rem" }}>
          {sectionHeading(
            "Dashboard",
            "A dashboard should tell the student what to do next",
            "Instead of static cards only, the dashboard can surface what is ready to review, where to continue, and what needs another pass.",
          )}
          <DashboardPreviewStrip />
        </section>

        <section aria-labelledby="homepage-faq-title" style={{ paddingTop: "1.25rem" }}>
          {sectionHeading(
            "FAQ",
            "Common questions before you upload",
            "Short answers to the questions students usually ask before they start using Studflow.",
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
            }}
          >
            {FAQ_ITEMS.map(({ question, answer }) => (
              <article
                key={question}
                style={{
                  padding: "1.3rem",
                  borderRadius: "24px",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 65%, var(--border))",
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--card) 95%, var(--theme-soft)), var(--card))",
                  boxShadow: "0 12px 30px color-mix(in srgb, var(--theme-shadow) 70%, transparent)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    marginBottom: "0.8rem",
                    color: "var(--theme-primary)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  <SparklesIcon size={15} strokeWidth={1.8} />
                  FAQ
                </div>

                <h3
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.55rem",
                    color: "var(--distill-text-primary)",
                  }}
                >
                  {question}
                </h3>

                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--distill-text-secondary)",
                  }}
                >
                  {answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="homepage-final-cta-title" style={{ paddingTop: "1.25rem" }}>
          <div
            style={{
              padding: "2rem 1.5rem",
              borderRadius: "32px",
              border: "1px solid color-mix(in srgb, var(--theme-border) 65%, var(--border))",
              background:
                "radial-gradient(circle at top, color-mix(in srgb, var(--theme-soft) 78%, transparent), transparent 48%), linear-gradient(180deg, color-mix(in srgb, var(--card) 95%, var(--theme-soft)), var(--card))",
              boxShadow: "0 18px 44px color-mix(in srgb, var(--theme-shadow) 75%, transparent)",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
              <p
                style={{
                  fontSize: "0.78rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--theme-primary)",
                  marginBottom: "0.65rem",
                }}
              >
                Start Here
              </p>
              <h2 id="homepage-final-cta-title" style={{ marginBottom: "0.75rem" }}>
                Ready to turn a document into a study session?
              </h2>
              <p
                style={{
                  maxWidth: "620px",
                  margin: "0 auto 1.5rem",
                  fontSize: "1rem",
                  color: "var(--distill-text-secondary)",
                }}
              >
                Upload a file and let Studflow prepare the summary, flashcards,
                quiz, notes, AI help, and review flow in one place.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <Link href="/dashboard/upload" className="btn-primary">
                  Start Studying
                </Link>
                <Link href="/dashboard" className="btn-ghost">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
