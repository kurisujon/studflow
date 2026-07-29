import { fetchDueFlashcards } from "@/lib/server-api";
import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";
import { DailyReviewHub } from "@/components/study/DailyReviewHub";

export default async function FlashcardsPage() {
  const flashcards = await fetchDueFlashcards();

  return (
    <DashboardFeatureShell
      tone="flashcards"
      eyebrow="Spaced repetition"
      title="Daily review"
      description="Strengthen recall one card at a time. Your ratings update the existing review schedule."
      count={{
        value: flashcards.length,
        label:
          flashcards.length === 1
            ? "card queued at start"
            : "cards queued at start",
      }}
    >
      <DailyReviewHub initialFlashcards={flashcards} />
    </DashboardFeatureShell>
  );
}
