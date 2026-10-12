import { PageContainer, PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DailyReviewHub } from "@/components/study/DailyReviewHub";
import { fetchDueFlashcards } from "@/lib/server-api";

export default async function ReviewPage() {
  const flashcards = await fetchDueFlashcards();
  return <PageContainer width="reading"><PageHeader eyebrow="Spaced repetition" title="Daily Review" description="Work through the cards due now. Your Again, Hard, Good, and Easy ratings update the existing review schedule." aside={<span className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--theme-primary)]">{flashcards.length} in starting queue</span>} />
    <DailyReviewHub initialFlashcards={flashcards} />
  </PageContainer>;
}
