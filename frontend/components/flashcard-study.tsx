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

  if (flashcards.length === 0) {
    return <p>No flashcards available yet.</p>;
  }

  const activeCard = flashcards[activeIndex];
  const progress = ((activeIndex + 1) / flashcards.length) * 100;

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

  return (
    <section style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <p
          style={{
            fontSize: "0.82rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--distill-text-muted)",
          }}
        >
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

      <div style={{ perspective: "1400px", marginBottom: "1.2rem" }}>
        <motion.button
          type="button"
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
            border: "1px solid var(--distill-border)",
            borderRadius: "28px",
            background: "linear-gradient(180deg, var(--card), color-mix(in srgb, var(--card) 86%, var(--theme-soft)))",
            boxShadow: "0 24px 56px color-mix(in srgb, var(--foreground) 8%, transparent)",
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
              <p
                style={{
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--distill-text-muted)",
                }}
              >
                {face.label}
              </p>
              <p
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2.4rem)",
                  lineHeight: 1.3,
                  color: "var(--distill-text-primary)",
                }}
              >
                {face.content}
              </p>
              <p
                style={{
                  fontSize: "0.92rem",
                  color: "var(--distill-text-secondary)",
                }}
              >
                Tap the card to flip.
              </p>
            </div>
          ))}
        </motion.button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Button
          variant="outline"
          disabled={activeIndex === 0 || isChangingCard}
          onClick={() => changeCard(activeIndex - 1)}
          style={{ minHeight: "42px", minWidth: "120px", paddingInline: "18px", borderRadius: "14px" }}
        >
          Previous
        </Button>
        <Button
          variant="default"
          disabled={activeIndex === flashcards.length - 1 || isChangingCard}
          onClick={() => changeCard(activeIndex + 1)}
          style={{
            minHeight: "42px",
            minWidth: "96px",
            paddingInline: "18px",
            borderRadius: "14px",
            color: "var(--theme-on-primary)",
          }}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
