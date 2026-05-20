"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { StudyFlashcard } from "@/lib/types";

export function FlashcardStudy({
  flashcards,
}: {
  flashcards: StudyFlashcard[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (flashcards.length === 0) {
    return <p>No flashcards available yet.</p>;
  }

  const activeCard = flashcards[activeIndex];
  const progress = ((activeIndex + 1) / flashcards.length) * 100;

  function changeCard(nextIndex: number) {
    setActiveIndex(nextIndex);
    setIsFlipped(false);
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
              backgroundColor: "var(--distill-text-primary)",
            }}
          />
        </div>
      </div>

      <div style={{ perspective: "1400px", marginBottom: "1.2rem" }}>
        <motion.button
          type="button"
          onClick={() => setIsFlipped((current) => !current)}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            width: "100%",
            minHeight: "360px",
            position: "relative",
            transformStyle: "preserve-3d",
            border: "1px solid var(--distill-border)",
            borderRadius: "28px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,245,243,0.96))",
            boxShadow: "0 24px 56px rgba(17,17,16,0.06)",
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
          disabled={activeIndex === 0}
          onClick={() => changeCard(activeIndex - 1)}
        >
          Previous
        </Button>
        <Button
          variant="default"
          disabled={activeIndex === flashcards.length - 1}
          onClick={() => changeCard(activeIndex + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
