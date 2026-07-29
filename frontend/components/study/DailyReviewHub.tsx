"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { StudyFlashcard } from "@/lib/types";
import { reviewFlashcardAction } from "@/app/actions/study";
import { useRouter } from "next/navigation";

const CARD_FLIP_DURATION_MS = 500;

export function DailyReviewHub({
  initialFlashcards,
}: {
  initialFlashcards: StudyFlashcard[];
}) {
  const [flashcards, setFlashcards] = useState<StudyFlashcard[]>(initialFlashcards);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isChangingCard, setIsChangingCard] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const flipDurationMs = reduceMotion ? 0 : CARD_FLIP_DURATION_MS;

  const handleReview = useCallback(
    async (rating: "again" | "hard" | "good" | "easy") => {
      if (isReviewing || isChangingCard) return;

      setIsReviewing(true);
      setReviewError(null);
      try {
        await reviewFlashcardAction(flashcards[0].id, rating);

        setIsChangingCard(true);
        setIsFlipped(false);

        setTimeout(() => {
          setFlashcards((prev) => prev.slice(1));
          setIsChangingCard(false);
          setIsReviewing(false);
        }, flipDurationMs);
      } catch (error) {
        console.error(error);
        setIsReviewing(false);
        setReviewError("The review could not be saved. Your current card is still here, so you can try again.");
      }
    },
    [isReviewing, isChangingCard, flashcards, flipDurationMs]
  );

  useEffect(() => {
    function handleFlashcardShortcuts(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.tagName === "BUTTON" ||
            target.tagName === "A" ||
            target.isContentEditable))
      ) {
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        if (!isChangingCard && !isReviewing) {
          setIsFlipped((current) => !current);
        }
        return;
      }

      if (isFlipped && !isChangingCard && !isReviewing) {
        if (event.key === "1") handleReview("again");
        if (event.key === "2") handleReview("hard");
        if (event.key === "3") handleReview("good");
        if (event.key === "4") handleReview("easy");
      }
    }

    window.addEventListener("keydown", handleFlashcardShortcuts);
    return () => {
      window.removeEventListener("keydown", handleFlashcardShortcuts);
    };
  }, [isFlipped, isChangingCard, isReviewing, handleReview]);

  if (flashcards.length === 0) {
    return (
      <div
        className="study-stage-shell"
        style={{
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          textAlign: "center",
          padding: "4rem 2rem",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--background) 98%, white), color-mix(in srgb, var(--background) 94%, var(--theme-soft)))",
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          🎉 You&apos;re all caught up!
        </h2>
        <p className="study-body-copy" style={{ marginBottom: "2.5rem" }}>
          You have reviewed all your due flashcards for today. Excellent work!
        </p>
        <Button
          onClick={() => router.push("/dashboard")}
          className="study-utility-pill"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const activeCard = flashcards[0];
  const progress = ((initialFlashcards.length - flashcards.length) / initialFlashcards.length) * 100;

  return (
    <section className="study-stage-shell" style={{ width: "100%", maxWidth: "1080px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <p className="study-meta-label">
          {initialFlashcards.length - flashcards.length} reviewed · {flashcards.length} remaining
        </p>
        <div
          role="progressbar"
          aria-label="Daily review progress"
          aria-valuemin={0}
          aria-valuemax={initialFlashcards.length}
          aria-valuenow={initialFlashcards.length - flashcards.length}
          style={{
            flex: 1,
            maxWidth: "280px",
            height: "6px",
            borderRadius: "999px",
            backgroundColor: "var(--distill-border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "var(--theme-primary)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
      <p
        className="study-body-copy"
        style={{ fontSize: "0.88rem", marginBottom: "1rem" }}
      >
        Shortcuts: Space flips the card. Number keys 1-4 to rate when flipped.
      </p>

      {reviewError ? (
        <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-700 dark:text-red-300">
          {reviewError}
        </div>
      ) : null}

      <div style={{ perspective: "1400px", marginBottom: "1.5rem" }}>
        <motion.button
          type="button"
          disabled={isReviewing || isChangingCard}
          aria-keyshortcuts="Space"
          onClick={() => {
            if (!isChangingCard && !isReviewing && !isFlipped) {
              setIsFlipped(true);
            }
          }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{
            duration: flipDurationMs / 1000,
            ease: "easeInOut",
          }}
          style={{
            width: "100%",
            minHeight: "400px",
            position: "relative",
            transformStyle: "preserve-3d",
            border: "1px solid color-mix(in srgb, var(--theme-border) 54%, var(--border))",
            borderRadius: "28px",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--card) 98%, white), color-mix(in srgb, var(--card) 90%, var(--theme-soft)))",
            boxShadow:
              "0 22px 52px color-mix(in srgb, var(--theme-shadow) 32%, transparent)",
            cursor: isFlipped ? "default" : "pointer",
            padding: 0,
          }}
        >
          {[
            { label: "Question", content: activeCard.front, rotate: 0 },
            { label: "Answer", content: activeCard.back, rotate: 180 },
          ].map((face) => (
            <div
              key={face.label}
              aria-hidden={face.rotate === 180 ? !isFlipped : isFlipped}
              style={{
                position: "absolute",
                inset: 0,
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backfaceVisibility: "hidden",
                transform: `rotateY(${face.rotate}deg)`,
              }}
            >
              <p className="study-meta-label">{face.label} side</p>
              <p
                style={{
                  fontSize: "clamp(1.4rem, 3vw, 2.25rem)",
                  lineHeight: 1.32,
                  color: "var(--distill-text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {face.content}
              </p>
              <p
                className="study-body-copy"
                style={{ fontSize: "0.92rem", opacity: isFlipped && face.rotate === 180 ? 0 : 1 }}
              >
                Tap the card to flip.
              </p>
            </div>
          ))}
        </motion.button>
      </div>

      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <Button
              variant="outline"
              disabled={isReviewing || isChangingCard}
              onClick={() => handleReview("again")}
              className="study-utility-pill border-red-500/50 bg-red-500/5 text-red-700 hover:bg-red-500/10 dark:text-red-300"
            >
              Again (1)
            </Button>
            <Button
              variant="outline"
              disabled={isReviewing || isChangingCard}
              onClick={() => handleReview("hard")}
              className="study-utility-pill border-amber-500/50 bg-amber-500/5 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300"
            >
              Hard (2)
            </Button>
            <Button
              variant="outline"
              disabled={isReviewing || isChangingCard}
              onClick={() => handleReview("good")}
              className="study-utility-pill border-emerald-500/50 bg-emerald-500/5 text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-300"
            >
              Good (3)
            </Button>
            <Button
              variant="outline"
              disabled={isReviewing || isChangingCard}
              onClick={() => handleReview("easy")}
              className="study-utility-pill border-blue-500/50 bg-blue-500/5 text-blue-700 hover:bg-blue-500/10 dark:text-blue-300"
            >
              Easy (4)
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
