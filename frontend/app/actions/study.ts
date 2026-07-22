"use server";

import { reviewFlashcard as serverReviewFlashcard } from "@/lib/server-api";

export async function reviewFlashcardAction(
  id: string,
  rating: "again" | "hard" | "good" | "easy",
) {
  return await serverReviewFlashcard(id, rating);
}
