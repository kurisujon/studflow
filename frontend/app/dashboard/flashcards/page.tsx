import { fetchDueFlashcards } from "@/lib/server-api";
import { DailyReviewHub } from "@/components/study/DailyReviewHub";

export default async function FlashcardsPage() {
  const flashcards = await fetchDueFlashcards();

  return (
    <div style={{ padding: "2rem", minHeight: "calc(100vh - 64px)" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1.5rem", textAlign: "center" }}>
        Daily Review
      </h1>
      <DailyReviewHub initialFlashcards={flashcards} />
    </div>
  );
}
