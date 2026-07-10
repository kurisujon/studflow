import { fetchDueFlashcards } from "@/lib/server-api";
import { DailyReviewHub } from "@/components/study/DailyReviewHub";

export default async function FlashcardsPage() {
  const flashcards = await fetchDueFlashcards();

  return (
    <section
      style={{
        minHeight: "calc(100dvh - var(--nav-height))",
        padding: "2rem 1.5rem 3rem",
        background:
          "radial-gradient(circle at top left, var(--theme-shadow), transparent 24%), linear-gradient(180deg, var(--background), color-mix(in srgb, var(--background) 82%, var(--theme-soft)))",
      }}
    >
      <div className="container" style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
          Daily Review
        </h1>
        <DailyReviewHub initialFlashcards={flashcards} />
      </div>
    </section>
  );
}
