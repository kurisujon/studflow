import Link from "next/link";

import { FlashcardStudy } from "@/components/flashcard-study";
import { QuizStudy } from "@/components/quiz-study";
import { SummaryStudy } from "@/components/summary-study";
import { Button } from "@/components/ui/button";
import { fetchStudyDocument } from "@/lib/server-api";

type StudyPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function StudyPage({
  params,
  searchParams,
}: StudyPageProps) {
  const { id } = await params;
  const { tab = "summary" } = await searchParams;
  const document = await fetchStudyDocument(id);

  return (
    <section
      style={{
        minHeight: "calc(100dvh - var(--nav-height))",
        padding: "2rem 1.5rem 3rem",
        background:
          "radial-gradient(circle at top left, rgba(251,191,36,0.18), transparent 22%), radial-gradient(circle at top right, rgba(249,115,22,0.12), transparent 18%), linear-gradient(180deg, #fffaf3, #fffdf8)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#c2410c",
                marginBottom: "0.5rem",
              }}
            >
              Study View
            </p>
            <h1 style={{ marginBottom: "0.35rem" }}>{document.filename}</h1>
            <p style={{ color: "#7c2d12" }}>Status: {document.status}</p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            { key: "summary", label: "Summary" },
            { key: "flashcards", label: "Flashcards" },
            { key: "quiz", label: "Quiz" },
          ].map((item) => (
            <Button
              key={item.key}
              nativeButton={false}
              render={<Link href={`/dashboard/study/${id}?tab=${item.key}`} />}
              variant={tab === item.key ? "default" : "outline"}
              size="lg"
              style={{
                minHeight: "42px",
                paddingInline: "18px",
                borderRadius: "999px",
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div
          style={{
            padding: "2rem",
            border: "1px solid rgba(251, 146, 60, 0.16)",
            borderRadius: "28px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,250,240,0.96))",
            boxShadow: "0 22px 60px rgba(249,115,22,0.08)",
          }}
        >
          {tab === "flashcards" ? (
            <FlashcardStudy flashcards={document.flashcards} />
          ) : null}

          {tab === "quiz" ? (
            <QuizStudy questions={document.quiz} />
          ) : null}

          {tab !== "flashcards" && tab !== "quiz" ? (
            <SummaryStudy documentId={document.id} summary={document.summary_data} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
