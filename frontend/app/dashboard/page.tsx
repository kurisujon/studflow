import Link from "next/link";

import { DashboardDocumentCard } from "@/components/dashboard-document-card";
import { fetchDocuments } from "@/lib/server-api";

export default async function DashboardPage() {
  const documents = await fetchDocuments();
  const completedDocuments = documents.filter((document) => document.status === "COMPLETED");
  const flashcardCount = documents.reduce(
    (total, document) => total + document.flashcard_count,
    0,
  );
  const readyQuizzes = documents.filter((document) => document.quiz_ready).length;

  return (
    <section
      style={{
        minHeight: "calc(100dvh - var(--nav-height))",
        padding: "2rem 1.5rem 3rem",
        background:
          "radial-gradient(circle at top left, var(--theme-shadow), transparent 24%), linear-gradient(180deg, var(--background), color-mix(in srgb, var(--background) 82%, var(--theme-soft)))",
      }}
    >
      <div className="container">
        <div
          style={{
            marginBottom: "1.75rem",
            maxWidth: "760px",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--theme-primary)",
              marginBottom: "0.75rem",
            }}
          >
            Dashboard
          </p>
          <h1 style={{ marginBottom: "0.75rem" }}>Your study materials, organized.</h1>
          <p>
            Review completed documents, continue active recall, or jump back into the quiz.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            {
              label: "Documents",
              value: String(documents.length),
              detail: "Uploaded study sources",
            },
            {
              label: "Ready to review",
              value: String(completedDocuments.length),
              detail: "Processed and study-ready",
            },
            {
              label: "Flashcards",
              value: String(flashcardCount),
              detail: "Available across documents",
            },
            {
              label: "Quizzes",
              value: String(readyQuizzes),
              detail: "Ready for active recall",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "1.05rem",
                borderRadius: "22px",
                border: "1px solid var(--theme-border)",
                background: "color-mix(in srgb, var(--card) 95%, var(--theme-soft))",
                boxShadow: "0 12px 30px color-mix(in srgb, var(--theme-shadow) 72%, transparent)",
              }}
            >
              <p
                style={{
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--theme-primary)",
                  marginBottom: "0.45rem",
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--distill-text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                {item.value}
              </p>
              <p style={{ color: "var(--distill-text-secondary)", fontSize: "0.9rem" }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {documents.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              border: "1px solid var(--theme-border)",
              borderRadius: "28px",
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--card) 95%, white), color-mix(in srgb, var(--card) 90%, var(--theme-soft)))",
              boxShadow: "0 18px 44px color-mix(in srgb, var(--theme-shadow) 78%, transparent)",
            }}
          >
            <p
              style={{
                fontSize: "0.74rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--theme-primary)",
                marginBottom: "0.65rem",
              }}
            >
              Empty Dashboard
            </p>
            <h2 style={{ marginBottom: "0.55rem" }}>No study documents yet.</h2>
            <p style={{ color: "var(--distill-text-secondary)", maxWidth: "48ch", marginBottom: "1rem" }}>
              Start with one upload. Studflow will turn it into a summary,
              flashcards, quiz, notes, and AI-assisted review flow.
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/dashboard/upload"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "42px",
                  paddingInline: "18px",
                  borderRadius: "14px",
                  backgroundColor: "var(--theme-primary)",
                  color: "var(--theme-on-primary)",
                  fontWeight: 600,
                }}
              >
                Upload a Document
              </Link>
              <Link
                href="/upload"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "42px",
                  paddingInline: "18px",
                  borderRadius: "14px",
                  border: "1px solid var(--theme-border)",
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  fontWeight: 600,
                }}
              >
                Open Upload Flow
              </Link>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {documents.map((document) => (
              <DashboardDocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
