"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { StudyFlashcard } from "@/lib/types";

const CARD_FLIP_DURATION_MS = 500;

export function FlashcardStudy({
  flashcards,
}: {
  flashcards: StudyFlashcard[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isChangingCard, setIsChangingCard] = useState(false);
  const cardChangeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (cardChangeTimeoutRef.current) {
        window.clearTimeout(cardChangeTimeoutRef.current);
      }
    };
  }, []);

  const changeCard = useCallback((nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= flashcards.length || isChangingCard) {
      return;
    }

    if (cardChangeTimeoutRef.current) {
      window.clearTimeout(cardChangeTimeoutRef.current);
    }

    if (!isFlipped) {
      setActiveIndex(nextIndex);
      return;
    }

    setIsChangingCard(true);
    setIsFlipped(false);
    cardChangeTimeoutRef.current = window.setTimeout(() => {
      setActiveIndex(nextIndex);
      setIsChangingCard(false);
      cardChangeTimeoutRef.current = null;
    }, CARD_FLIP_DURATION_MS);
  }, [flashcards.length, isChangingCard, isFlipped]);

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
            target.isContentEditable))
      ) {
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        if (!isChangingCard) {
          setIsFlipped((current) => !current);
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeCard(activeIndex - 1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        changeCard(activeIndex + 1);
      }
    }

    window.addEventListener("keydown", handleFlashcardShortcuts);
    return () => {
      window.removeEventListener("keydown", handleFlashcardShortcuts);
    };
  }, [activeIndex, changeCard, isChangingCard]);

  if (flashcards.length === 0) {
    return (
      <section className="w-full max-w-4xl mx-auto px-6 sm:px-8 md:px-12 pt-12 lg:pt-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 tracking-tight">Active Recall</h1>
        <div className="p-8 rounded-2xl border border-border/40 bg-card/50 text-center">
          <p className="text-muted-foreground">No flashcards available yet.</p>
        </div>
      </section>
    );
  }

  const activeCard = flashcards[activeIndex];
  const progress = ((activeIndex + 1) / flashcards.length) * 100;

  return (
    <section className="w-full max-w-4xl mx-auto px-6 sm:px-8 md:px-12 pt-12 lg:pt-16 pb-24">
      <div className="mb-14 flex flex-col md:flex-row md:items-center gap-6 justify-between">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight m-0">Active Recall</h1>
        
        <div className="flex items-center gap-4 w-full md:w-auto md:min-w-[240px]">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {activeIndex + 1} / {flashcards.length}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
            <div
              className="h-full bg-theme-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-10 text-sm text-muted-foreground">
        <span>Shortcuts:</span>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-mono text-xs border border-border/50 shadow-sm">Space</span>
          <span>to flip,</span>
          <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-mono text-xs border border-border/50 shadow-sm">←</span>
          <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-mono text-xs border border-border/50 shadow-sm">→</span>
          <span>to navigate.</span>
        </div>
      </div>

      <div className="relative w-full max-w-3xl mx-auto mb-12 perspective-[2000px]" style={{ perspective: "2000px" }}>
        <motion.button
          type="button"
          aria-keyshortcuts="Space ArrowLeft ArrowRight"
          onClick={() => {
            if (!isChangingCard) {
              setIsFlipped((current) => !current);
            }
          }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: CARD_FLIP_DURATION_MS / 1000, ease: "easeInOut" }}
          className="w-full min-h-[400px] sm:min-h-[480px] relative cursor-pointer rounded-[32px] border border-border/40 bg-card shadow-lg hover:shadow-xl transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background p-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front Face (Prompt) */}
          <div
            className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-between bg-gradient-to-b from-card to-muted/20 rounded-[32px]"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex justify-between items-start w-full mb-6">
              <span className="text-xs font-bold text-theme-primary uppercase tracking-wider">Prompt</span>
              <span className="text-xs font-medium text-muted-foreground opacity-70">Tap to flip</span>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-y-auto px-2">
              <p className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground leading-snug text-balance">
                {activeCard.front}
              </p>
            </div>
            <div className="w-full flex justify-center mt-6">
              <span className="text-xs text-muted-foreground opacity-0" aria-hidden="true">Spacer</span>
            </div>
          </div>

          {/* Back Face (Answer) */}
          <div
            className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-between bg-gradient-to-b from-card to-theme-soft/10 rounded-[32px]"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="flex justify-between items-start w-full mb-6">
              <span className="text-xs font-bold text-theme-primary uppercase tracking-wider">Answer</span>
              <span className="text-xs font-medium text-muted-foreground opacity-70">Tap to flip</span>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-y-auto px-2">
              <p className="text-xl sm:text-2xl md:text-3xl text-foreground leading-relaxed text-balance">
                {activeCard.back}
              </p>
            </div>
            <div className="w-full flex justify-center mt-6">
              <span className="text-xs text-muted-foreground opacity-0" aria-hidden="true">Spacer</span>
            </div>
          </div>
        </motion.button>
      </div>

      <div className="flex flex-wrap items-center justify-between max-w-3xl mx-auto mt-12 pt-8 border-t border-border/40 gap-4">
        <Button
          variant="outline"
          size="lg"
          disabled={activeIndex === 0 || isChangingCard}
          onClick={() => changeCard(activeIndex - 1)}
          className="min-h-[48px] min-w-[140px] rounded-full"
        >
          Previous
        </Button>
        <Button
          size="lg"
          disabled={activeIndex === flashcards.length - 1 || isChangingCard}
          onClick={() => changeCard(activeIndex + 1)}
          className="min-h-[48px] min-w-[140px] rounded-full"
          style={{
            backgroundColor: "var(--theme-primary)",
            color: "var(--theme-on-primary)",
          }}
        >
          Next
        </Button>
      </div>
    </section>
  );
}

