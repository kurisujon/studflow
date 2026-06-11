"use client";

import { useEffect, useRef, useState } from "react";
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

  function changeCard(nextIndex: number) {
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
  }

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
      <div className="study-stage-shell">
        <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
          Flashcards
        </p>
        <div className="study-empty-state">
          <p className="study-body-copy">No flashcards available yet.</p>
        </div>
      </div>
    );
  }

  const activeCard = flashcards[activeIndex];
  const progress = ((activeIndex + 1) / flashcards.length) * 100;

  return (
    <section className="study-stage-shell" style={{ width: "100%" }}>
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
          Card {activeIndex + 1} of {flashcards.length}
        </p>
        <div
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
            }}
          />
        </div>
      </div>
      <p className="study-body-copy" style={{ fontSize: "0.88rem", marginBottom: "1rem" }}>
        Shortcuts: Space flips the card. Left and Right move between cards.
      </p>

      <div style={{ perspective: "1400px", marginBottom: "1.2rem" }}>
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
          style={{
            width: "100%",
            minHeight: "360px",
            position: "relative",
            transformStyle: "preserve-3d",
            border: "1px solid color-mix(in srgb, var(--theme-border) 54%, var(--border))",
            borderRadius: "28px",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--card) 98%, white), color-mix(in srgb, var(--card) 90%, var(--theme-soft)))",
            boxShadow: "0 22px 52px color-mix(in srgb, var(--theme-shadow) 32%, transparent)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {[
            { label: "Prompt", content: activeCard.front, rotate: 0 },
            { label: "Answer", content: activeCard.back, rotate: 180 },
          ].map((face) => (
            <div
              key={face.label}
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
              <p className="study-meta-label">
                {face.label}
              </p>
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
              <p className="study-body-copy" style={{ fontSize: "0.92rem" }}>
                Tap the card to flip.
              </p>
            </div>
          ))}
        </motion.button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Button
          variant="outline"
          disabled={activeIndex === 0 || isChangingCard}
          onClick={() => changeCard(activeIndex - 1)}
          className="study-utility-pill"
          style={{ minWidth: "120px" }}
        >
          Previous
        </Button>
        <Button
          variant="default"
          disabled={activeIndex === flashcards.length - 1 || isChangingCard}
          onClick={() => changeCard(activeIndex + 1)}
          className="study-utility-pill"
          style={{
            minWidth: "96px",
            color: "var(--theme-on-primary)",
          }}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
