import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { DocumentListItem } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function DashboardDocumentCard({
  document,
}: {
  document: DocumentListItem;
}) {
  return (
    <article
      style={{
        border: "1px solid var(--distill-border)",
        borderRadius: "24px",
        padding: "1.35rem",
        backgroundColor: "rgba(255,255,255,0.82)",
        boxShadow: "0 14px 40px rgba(17,17,16,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.15rem",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--distill-text-muted)",
              marginBottom: "0.45rem",
            }}
          >
            {formatDate(document.created_at)}
          </p>
          <h2
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.35,
              color: "var(--distill-text-primary)",
              wordBreak: "break-word",
            }}
          >
            {document.filename}
          </h2>
        </div>

        <span
          style={{
            padding: "0.35rem 0.6rem",
            borderRadius: "999px",
            backgroundColor: "var(--distill-border)",
            color: "var(--distill-text-secondary)",
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {document.status}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        {[
          {
            label: "Pages",
            value: document.page_count ? String(document.page_count) : "—",
          },
          {
            label: "Flashcards",
            value: String(document.flashcard_count),
          },
          {
            label: "Quiz",
            value: document.quiz_ready ? "Ready" : "Waiting",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "0.85rem",
              borderRadius: "18px",
              backgroundColor: "rgba(249,249,248,0.92)",
              border: "1px solid var(--distill-border)",
            }}
          >
            <p
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--distill-text-muted)",
                marginBottom: "0.3rem",
              }}
            >
              {stat.label}
            </p>
            <p style={{ color: "var(--distill-text-primary)" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.65rem",
        }}
      >
        <Button
          nativeButton={false}
          render={<Link href={`/dashboard/study/${document.id}?tab=summary`} />}
          variant="default"
        >
          Summary
        </Button>
        <Button
          nativeButton={false}
          render={<Link href={`/dashboard/study/${document.id}?tab=flashcards`} />}
          variant="outline"
        >
          Flashcards
        </Button>
        <Button
          nativeButton={false}
          render={<Link href={`/dashboard/study/${document.id}?tab=quiz`} />}
          variant="outline"
        >
          Quiz
        </Button>
      </div>
    </article>
  );
}
