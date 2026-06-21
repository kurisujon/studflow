import Link from "next/link";

import { AnimatedHeroUploadCard } from "@/components/home/AnimatedHeroUploadCard";
import { SystemGallery } from "@/components/home/SystemGallery";
import { AnimatedStudyPreview } from "@/components/home/AnimatedStudyPreview";
import { AnimatedWorkflowLine } from "@/components/home/AnimatedWorkflowLine";
import { FloatingStudyIcons } from "@/components/home/FloatingStudyIcons";
import {
  BotIcon,
  CircleHelpIcon,
  FileTextIcon,
  FolderOpenIcon,
  LayersIcon,
  PlayCircleIcon,
  SparklesIcon,
  StickyNoteIcon,
} from "@/components/home/icon-registry";

const SUPPORTED_FORMATS = ["PDF", "DOCX"] as const;
const UPCOMING_FORMATS = ["PPT soon", "TXT soon"] as const;

const HERO_CHIPS = [
  { label: "1 summary", icon: FileTextIcon },
  { label: "15 flashcards", icon: LayersIcon },
  { label: "10-question quiz", icon: CircleHelpIcon },
] as const;

const FEATURE_CARDS = [
  {
    title: "Concise summary",
    description:
      "Get the main ideas first before moving into active recall and review.",
    icon: FileTextIcon,
    preview: "lines",
  },
  {
    title: "Flashcards",
    description: "Review key concepts with cards generated from the same source document.",
    icon: LayersIcon,
    preview: "stack",
  },
  {
    title: "Quiz",
    description: "Test understanding, track attempts, and retry what you missed.",
    icon: CircleHelpIcon,
    preview: "quiz",
  },
  {
    title: "Ask AI",
    description: "Ask about selected text, saved notes, or the whole document.",
    icon: BotIcon,
    preview: "chat",
  },
  {
    title: "Notes and highlights",
    description: "Mark what matters and return to the same context later.",
    icon: StickyNoteIcon,
    preview: "highlight",
  },
  {
    title: "Related videos",
    description: "Watch supporting material without leaving the study flow.",
    icon: PlayCircleIcon,
    preview: "video",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Upload your source material",
    description: "Start with a PDF or DOCX and keep the entry point simple.",
    icon: FileTextIcon,
  },
  {
    step: "02",
    title: "Generate the study set",
    description: "Studflow prepares summary, flashcards, and quiz output from the same document.",
    icon: SparklesIcon,
  },
  {
    step: "03",
    title: "Study in one workspace",
    description: "Read, annotate, ask AI, retry quiz misses, and continue in context.",
    icon: BotIcon,
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "What file types does Studflow support?",
    answer: "Studflow currently supports PDF and DOCX files only.",
  },
  {
    question: "Does Studflow replace studying?",
    answer:
      "No. It improves review quality, but you still need to understand and practice the material.",
  },
  {
    question: "Can I ask AI about the full document?",
    answer:
      "Yes. You can ask about selected text, saved notes, or the full uploaded document.",
  },
  {
    question: "Can I retry missed quiz questions only?",
    answer:
      "Yes. Studflow stores quiz attempts and lets you retry missed questions from the latest result or saved history.",
  },
  {
    question: "Can I save AI answers into flashcards?",
    answer:
      "Yes. Suggested flashcards from the AI panel can be saved into the current document’s flashcard set.",
  },
] as const;

function renderFeaturePreview(type: (typeof FEATURE_CARDS)[number]["preview"]) {
  if (type === "lines") {
    return (
      <div style={{ display: "grid", gap: "0.45rem" }}>
        {["76%", "88%", "62%"].map((width, index) => (
          <div
            key={`${type}-${width}-${index}`}
            style={{
              height: "0.5rem",
              width,
              borderRadius: "999px",
              background:
                index === 1
                  ? "color-mix(in srgb, var(--theme-primary) 28%, var(--theme-soft))"
                  : "color-mix(in srgb, var(--theme-soft) 78%, var(--border))",
              transition: "transform var(--transition-fast), opacity var(--transition-fast)",
            }}
          />
        ))}
      </div>
    );
  }

  if (type === "stack") {
    return (
      <div style={{ position: "relative", height: "4.7rem" }}>
        {[0, 1, 2].map((index) => (
          <div
            key={`${type}-${index}`}
            style={{
              position: "absolute",
              inset: `${index * 0.45}rem ${index * 0.4}rem auto 0`,
              height: "3.15rem",
              borderRadius: "16px",
              border: "1px solid color-mix(in srgb, var(--theme-border) 66%, var(--border))",
              backgroundColor: index === 0 ? "var(--card)" : "color-mix(in srgb, var(--card) 96%, var(--theme-soft))",
              transform: `translate(${index * 10}px, ${index * 6}px)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === "quiz") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.45rem",
          padding: "0.55rem 0.75rem",
          borderRadius: "999px",
          border: "1px solid color-mix(in srgb, var(--theme-border) 70%, var(--border))",
          backgroundColor: "color-mix(in srgb, var(--card) 96%, var(--theme-soft))",
          color: "var(--distill-text-primary)",
          fontSize: "0.84rem",
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: "0.75rem",
            height: "0.75rem",
            borderRadius: "999px",
            backgroundColor: "#77a587",
            boxShadow: "0 0 0 4px rgba(119, 165, 135, 0.16)",
          }}
        />
        Ready to review
      </div>
    );
  }

  if (type === "chat") {
    return (
      <div style={{ display: "grid", gap: "0.55rem" }}>
        <div
          style={{
            width: "72%",
            marginLeft: "auto",
            padding: "0.65rem 0.8rem",
            borderRadius: "16px 16px 8px 16px",
            backgroundColor: "color-mix(in srgb, var(--theme-soft) 88%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--theme-border) 70%, var(--border))",
            fontSize: "0.82rem",
            color: "var(--distill-text-primary)",
          }}
        >
          Explain this term.
        </div>
        <div
          style={{
            width: "82%",
            padding: "0.7rem 0.85rem",
            borderRadius: "16px 16px 16px 8px",
            backgroundColor: "var(--card)",
            border: "1px solid color-mix(in srgb, var(--theme-border) 58%, var(--border))",
            fontSize: "0.82rem",
            color: "var(--distill-text-secondary)",
          }}
        >
          Grounded answer from the document.
        </div>
      </div>
    );
  }

  if (type === "highlight") {
    return (
      <div
        style={{
          padding: "0.85rem 0.95rem",
          borderRadius: "18px",
          border: "1px solid color-mix(in srgb, var(--theme-border) 64%, var(--border))",
          backgroundColor: "var(--card)",
          color: "var(--distill-text-secondary)",
          fontSize: "0.88rem",
          lineHeight: 1.6,
        }}
      >
        Review the{" "}
        <span
          style={{
            padding: "0.05rem 0.25rem",
            borderRadius: "0.4rem",
            backgroundColor: "color-mix(in srgb, var(--theme-soft) 84%, var(--card))",
            boxShadow: "inset 0 -0.42rem 0 color-mix(in srgb, var(--theme-primary) 22%, transparent)",
            color: "var(--distill-text-primary)",
          }}
        >
          highlighted phrase
        </span>{" "}
        and keep the note beside it.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.9rem",
        borderRadius: "18px",
        border: "1px solid color-mix(in srgb, var(--theme-border) 64%, var(--border))",
        backgroundColor: "var(--card)",
      }}
    >
      <div
        style={{
          width: "3.1rem",
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
          boxShadow: "0 0 0 4px rgba(111, 165, 181, 0.12)",
        }}
      >
        <PlayCircleIcon size={15} strokeWidth={1.8} />
      </div>
      <div>
        <p style={{ fontSize: "0.82rem", color: "var(--distill-text-primary)", fontWeight: 600 }}>
          Watch in the same flow
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--distill-text-muted)" }}>
          Supporting explanation stays nearby
        </p>
      </div>
    </div>
  );
}

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

function DashboardPreviewStrip() {
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
            The dashboard should show what is ready to review and what needs another pass, not just a list of files.
          </p>

          <div style={{ display: "grid", gap: "0.8rem" }}>
            {[
              { label: "Ready to review", value: "3 documents", icon: FolderOpenIcon },
              { label: "Latest quiz", value: "Retry missed questions", icon: SparklesIcon },
              { label: "Saved notes", value: "Return to highlighted passages", icon: StickyNoteIcon },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
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
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
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
              The dashboard should guide the student back to upload instead of leaving a blank placeholder card.
            </p>
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
            position: "relative",
            display: "grid",
            gap: "2rem",
            alignItems: "center",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          <FloatingStudyIcons />

          <div style={{ textAlign: "left", position: "relative", zIndex: 1 }}>
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
          </div>

          <Link href="/dashboard/upload" aria-label="Go to upload page" style={{ display: "block", width: "100%", position: "relative", zIndex: 1 }}>
            <AnimatedHeroUploadCard />
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

        <section aria-labelledby="homepage-gallery-title" style={{ paddingTop: "1.25rem" }}>
          {sectionHeading(
            "System Preview",
            "A seamless end-to-end study experience",
            "Everything you need to master your material, integrated into one unified workflow."
          )}
          <SystemGallery />
        </section>

        <section aria-labelledby="homepage-workflow-title" style={{ paddingTop: "1.25rem", position: "relative" }}>
          {sectionHeading(
            "Workflow",
            "A study flow with motion that actually explains the product",
            "Studflow should feel alive because the product is moving, not because the page is overloaded with decoration.",
          )}
          <AnimatedWorkflowLine />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {WORKFLOW_STEPS.map(({ step, title, description, icon: Icon }) => (
              <article
                key={step}
                style={{
                  padding: "1.35rem",
                  borderRadius: "24px",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 65%, var(--border))",
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--card) 95%, var(--theme-soft)), var(--card))",
                  boxShadow: "0 12px 30px color-mix(in srgb, var(--theme-shadow) 70%, transparent)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "2.8rem",
                    height: "2.8rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "999px",
                    marginBottom: "1rem",
                    border: "1px solid color-mix(in srgb, var(--theme-border) 80%, var(--border))",
                    backgroundColor: "color-mix(in srgb, var(--theme-soft) 88%, var(--card))",
                    color: "var(--theme-primary)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </div>

                <p className="study-meta-label" style={{ marginBottom: "0.55rem" }}>
                  Step {step}
                </p>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    marginBottom: "0.55rem",
                    color: "var(--distill-text-primary)",
                  }}
                >
                  {title}
                </h3>

                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--distill-text-secondary)",
                  }}
                >
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="homepage-features-title" style={{ paddingTop: "1.25rem" }}>
          {sectionHeading(
            "Study Outputs",
            "The main capabilities deserve a stronger product layout",
            "The homepage should show the shape of the workflow clearly: summary first, active recall next, AI and notes as support.",
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
            }}
          >
            {FEATURE_CARDS.map(({ title, description, icon: Icon, preview }) => (
              <article
                key={title}
                className="homepage-feature-card"
                style={{
                  padding: "1.35rem",
                  borderRadius: "26px",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 65%, var(--border))",
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--card) 97%, white), color-mix(in srgb, var(--card) 92%, var(--theme-soft)))",
                  boxShadow: "0 14px 34px color-mix(in srgb, var(--theme-shadow) 68%, transparent)",
                  minHeight: "250px",
                  display: "grid",
                  gap: "1rem",
                  alignContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "2.85rem",
                      height: "2.85rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "18px",
                      marginBottom: "1rem",
                      border: "1px solid color-mix(in srgb, var(--theme-border) 75%, var(--border))",
                      backgroundColor: "color-mix(in srgb, var(--card) 88%, var(--theme-soft))",
                      color: "var(--theme-primary)",
                    }}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                  </div>

                  <h3
                    style={{
                      fontSize: "1.05rem",
                      marginBottom: "0.5rem",
                      color: "var(--distill-text-primary)",
                    }}
                  >
                    {title}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--distill-text-secondary)",
                    }}
                  >
                    {description}
                  </p>
                </div>

                {renderFeaturePreview(preview)}
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="homepage-workspace-preview-title" style={{ paddingTop: "1.25rem" }}>
          {sectionHeading(
            "Study Workspace",
            "See the study environment before you upload",
            "The preview stays product-accurate: summary, highlights, AI help, saved notes, flashcards, quiz, and related videos.",
          )}
          <AnimatedStudyPreview />
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
