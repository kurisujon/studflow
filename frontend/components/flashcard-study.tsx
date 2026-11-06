"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  RotateCcwIcon,
  RotateCwIcon,
  ShuffleIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  Volume2Icon,
  VolumeXIcon,
} from "@/components/home/icon-registry";

import { reviewFlashcardAction } from "@/app/actions/study";
import { Button } from "@/components/ui/button";
import type { StudyFlashcard } from "@/lib/types";

const CARD_FLIP_DURATION_MS = 500;

type ConfidenceRating = "again" | "hard" | "good" | "easy";

function renderRichCardText(content: string) {
  if (!content) return null;

  // Format inline code snippets wrapped in backticks
  if (content.includes("`")) {
    const parts = content.split(/(`[^`]+`)/g);
    return (
      <span>
        {parts.map((part, index) => {
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code
                key={index}
                className="mx-1 inline-block rounded-md border border-border/70 bg-muted/80 px-2 py-0.5 font-mono text-[0.85em] font-semibold text-[var(--theme-primary)]"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  }

  // Format line breaks cleanly if present
  if (content.includes("\n")) {
    return (
      <span className="space-y-2">
        {content.split("\n").map((line, idx) => (
          <span key={idx} className="block">
            {line}
          </span>
        ))}
      </span>
    );
  }

  return <span>{content}</span>;
}

export function FlashcardStudy({
  flashcards,
  active = true,
}: {
  flashcards: StudyFlashcard[];
  active?: boolean;
}) {
  const [shuffledDeck, setShuffledDeck] = useState<StudyFlashcard[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isChangingCard, setIsChangingCard] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<Record<ConfidenceRating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  const reduceMotion = useReducedMotion();
  const flipDurationMs = reduceMotion ? 0 : CARD_FLIP_DURATION_MS;
  const cardChangeTimeoutRef = useRef<number | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (cardChangeTimeoutRef.current) {
        window.clearTimeout(cardChangeTimeoutRef.current);
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Base deck: shuffled if enabled, else input flashcards
  const deck = isShuffled && shuffledDeck ? shuffledDeck : flashcards;

  // Filtered deck (all cards vs starred only)
  const activeDeck = useMemo(() => {
    if (!filterStarredOnly) return deck;
    return deck.filter((card) => starredIds.has(card.id));
  }, [deck, filterStarredOnly, starredIds]);

  const activeCard: StudyFlashcard | undefined = activeDeck[activeIndex];

  // Stop speech synthesis when active card changes
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [activeIndex, isFlipped]);

  const handleSpeak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !activeCard) {
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = isFlipped ? activeCard.back : activeCard.front;
    // Strip backticks before speaking for natural speech
    const cleanText = textToSpeak.replace(/`/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [activeCard, isFlipped]);

  const toggleStar = useCallback((cardId: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    if (!isShuffled) {
      // Fisher-Yates shuffle
      const shuffled = [...flashcards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledDeck(shuffled);
      setIsShuffled(true);
    } else {
      setShuffledDeck(null);
      setIsShuffled(false);
    }
    setActiveIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, [flashcards, isShuffled]);

  const triggerCompletionConfetti = useCallback(() => {
    import("canvas-confetti").then((module) => {
      const confetti = module.default;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    });
  }, []);

  const changeCard = useCallback(
    (nextIndex: number) => {
      if (isChangingCard) return;

      if (nextIndex >= activeDeck.length) {
        setIsCompleted(true);
        triggerCompletionConfetti();
        return;
      }

      if (nextIndex < 0) return;

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
      }, flipDurationMs);
    },
    [activeDeck.length, flipDurationMs, isChangingCard, isFlipped, triggerCompletionConfetti],
  );

  const handleRate = useCallback(
    (rating: ConfidenceRating) => {
      if (!activeCard) return;

      // Track session statistics
      setSessionRatings((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));

      // Fire server action in background without blocking UI
      reviewFlashcardAction(activeCard.id, rating).catch((err: unknown) => {
        console.warn("Could not save flashcard review rating:", err);
      });

      // Move to next card
      changeCard(activeIndex + 1);
    },
    [activeCard, activeIndex, changeCard],
  );

  const restartDeck = useCallback(() => {
    setActiveIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionRatings({ again: 0, hard: 0, good: 0, easy: 0 });
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    if (!active || isCompleted) return;

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

      // Space: Flip card
      if (event.key === " ") {
        event.preventDefault();
        if (!isChangingCard) {
          setIsFlipped((current) => !current);
        }
        return;
      }

      // ArrowLeft: Navigate previous
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeCard(activeIndex - 1);
        return;
      }

      // ArrowRight: Navigate next
      if (event.key === "ArrowRight") {
        event.preventDefault();
        changeCard(activeIndex + 1);
        return;
      }

      // 's' or 'S': Star / Unstar
      if (event.key === "s" || event.key === "S") {
        if (activeCard) {
          event.preventDefault();
          toggleStar(activeCard.id);
        }
        return;
      }

      // 'r' or 'R': Read aloud / TTS
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        handleSpeak();
        return;
      }

      // 1, 2, 3, 4 ratings when card is flipped
      if (isFlipped) {
        if (event.key === "1") {
          event.preventDefault();
          handleRate("again");
        } else if (event.key === "2") {
          event.preventDefault();
          handleRate("hard");
        } else if (event.key === "3") {
          event.preventDefault();
          handleRate("good");
        } else if (event.key === "4") {
          event.preventDefault();
          handleRate("easy");
        }
      }
    }

    window.addEventListener("keydown", handleFlashcardShortcuts);
    return () => {
      window.removeEventListener("keydown", handleFlashcardShortcuts);
    };
  }, [
    active,
    activeCard,
    activeIndex,
    changeCard,
    handleRate,
    handleSpeak,
    isChangingCard,
    isCompleted,
    isFlipped,
    toggleStar,
  ]);

  if (flashcards.length === 0) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 pt-10 pb-20 sm:px-6 md:px-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Active Recall</h1>
        <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-xs">
          <p className="text-muted-foreground">No flashcards available for this document yet.</p>
        </div>
      </section>
    );
  }

  // Session completion view
  if (isCompleted) {
    const totalRated =
      sessionRatings.again + sessionRatings.hard + sessionRatings.good + sessionRatings.easy;

    return (
      <section className="mx-auto w-full max-w-2xl px-4 pt-10 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center rounded-3xl border border-border/80 bg-card p-8 text-center shadow-xl sm:p-12"
        >
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-xs">
            <TrophyIcon aria-hidden="true" className="size-8" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Deck Complete!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            You reviewed all {activeDeck.length} cards in this study session.
          </p>

          {/* Stats Breakdown */}
          {totalRated > 0 ? (
            <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex flex-col items-center rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                  {sessionRatings.again}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Again</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {sessionRatings.hard}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Hard</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {sessionRatings.good}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Good</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {sessionRatings.easy}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Easy</span>
              </div>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={restartDeck}
              className="min-h-[48px] rounded-full px-6 font-semibold"
              style={{
                backgroundColor: "var(--theme-primary)",
                color: "var(--theme-on-primary)",
              }}
            >
              <RotateCcwIcon aria-hidden="true" className="mr-2 size-4" />
              Practice Again
            </Button>

            {starredIds.size > 0 && !filterStarredOnly ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setFilterStarredOnly(true);
                  restartDeck();
                }}
                className="min-h-[48px] rounded-full border-amber-500/30 px-6 font-semibold text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
              >
                <StarIcon aria-hidden="true" className="mr-2 size-4 fill-amber-500 text-amber-500" />
                Review Starred ({starredIds.size})
              </Button>
            ) : null}

            {filterStarredOnly ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setFilterStarredOnly(false);
                  restartDeck();
                }}
                className="min-h-[48px] rounded-full px-6"
              >
                Study All Cards
              </Button>
            ) : null}
          </div>
        </motion.div>
      </section>
    );
  }

  if (!activeCard) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 pt-10 pb-20 text-center">
        <div className="rounded-2xl border border-border/80 bg-card p-10">
          <p className="text-muted-foreground">No cards match the active filter.</p>
          <Button
            variant="outline"
            onClick={() => setFilterStarredOnly(false)}
            className="mt-4 rounded-full"
          >
            Show All Flashcards
          </Button>
        </div>
      </section>
    );
  }

  const progress = ((activeIndex + 1) / activeDeck.length) * 100;
  const isCurrentStarred = starredIds.has(activeCard.id);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pt-6 pb-20 sm:px-6 md:px-8 lg:pt-8">
      {/* HEADER & CONTROLS TOOLBAR */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Active Recall
            </h1>
            {filterStarredOnly ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <StarIcon aria-hidden="true" className="size-3 fill-amber-500 text-amber-500" />
                Starred Only
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Test your memory before revealing the answer. Rate your confidence to train spaced recall.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {/* Read aloud TTS button */}
          <button
            type="button"
            onClick={handleSpeak}
            title={isSpeaking ? "Stop speaking (R)" : "Read aloud (R)"}
            aria-label={isSpeaking ? "Stop speaking" : "Read card aloud"}
            className={`flex size-9 items-center justify-center rounded-xl border transition-colors ${
              isSpeaking
                ? "border-[var(--theme-primary)] bg-[var(--theme-soft)] text-[var(--theme-primary)]"
                : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {isSpeaking ? (
              <VolumeXIcon aria-hidden="true" className="size-4 animate-pulse" />
            ) : (
              <Volume2Icon aria-hidden="true" className="size-4" />
            )}
          </button>

          {/* Shuffle Toggle */}
          <button
            type="button"
            onClick={toggleShuffle}
            title={isShuffled ? "Shuffled (Click to restore order)" : "Shuffle deck"}
            aria-label="Shuffle flashcards"
            className={`flex size-9 items-center justify-center rounded-xl border transition-colors ${
              isShuffled
                ? "border-[var(--theme-primary)] bg-[var(--theme-soft)] text-[var(--theme-primary)]"
                : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <ShuffleIcon aria-hidden="true" className="size-4" />
          </button>

          {/* Starred Filter Toggle */}
          <button
            type="button"
            onClick={() => {
              setFilterStarredOnly((prev) => !prev);
              setActiveIndex(0);
              setIsFlipped(false);
            }}
            title={
              filterStarredOnly
                ? "Show all cards"
                : `Filter starred cards (${starredIds.size})`
            }
            aria-label="Filter starred cards"
            className={`flex size-9 items-center justify-center rounded-xl border transition-colors ${
              filterStarredOnly
                ? "border-amber-500/40 bg-amber-500/15 text-amber-500"
                : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <StarIcon
              aria-hidden="true"
              className={`size-4 ${starredIds.size > 0 ? "text-amber-500" : ""}`}
            />
          </button>

          {/* Restart Button */}
          <button
            type="button"
            onClick={restartDeck}
            title="Restart deck"
            aria-label="Restart deck"
            className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <RotateCcwIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mb-6 flex items-center gap-3">
        <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
          {activeIndex + 1} / {activeDeck.length}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/40">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--theme-primary)",
            }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>

      {/* FLASHCARD WITH 3D PHYSICAL DECK STACK */}
      <div className="relative mx-auto mb-8 w-full max-w-3xl perspective-[2000px]">
        {/* Layer 2 (Bottom card shadow in deck) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 translate-y-3.5 scale-[0.96] rounded-[32px] border border-border/30 bg-card/40 shadow-xs transition-transform"
        />

        {/* Layer 1 (Middle card shadow in deck) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 translate-y-2 scale-[0.98] rounded-[32px] border border-border/50 bg-card/75 shadow-sm transition-transform"
        />

        {/* Screen reader notification */}
        <p className="sr-only" aria-live="polite">
          {isFlipped ? "Answer shown" : "Prompt shown"} for card {activeIndex + 1} of{" "}
          {activeDeck.length}.
        </p>

        {/* Interactive Flippable Card */}
        <motion.button
          type="button"
          aria-keyshortcuts="Space ArrowLeft ArrowRight 1 2 3 4"
          onClick={() => {
            if (!isChangingCard) {
              setIsFlipped((current) => !current);
            }
          }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: flipDurationMs / 1000, ease: "easeInOut" }}
          className="group relative min-h-[380px] w-full cursor-pointer rounded-[32px] border border-border/80 bg-card p-0 shadow-lg transition-all hover:border-[var(--theme-primary)]/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] sm:min-h-[440px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* FRONT FACE (PROMPT) */}
          <div
            aria-hidden={isFlipped}
            inert={isFlipped ? true : undefined}
            className="absolute inset-0 flex flex-col justify-between rounded-[32px] bg-gradient-to-b from-card via-card to-muted/20 p-6 sm:p-10"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-bold tracking-wider text-[var(--theme-primary)] uppercase">
                <SparklesIcon aria-hidden="true" className="size-3.5 text-[var(--theme-primary)]" />
                Prompt • Card {activeIndex + 1}
              </span>

              <div className="flex items-center gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(activeCard.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      toggleStar(activeCard.id);
                    }
                  }}
                  title={isCurrentStarred ? "Unstar card (S)" : "Star card (S)"}
                  aria-label="Star this card"
                  className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                    isCurrentStarred
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                      : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <StarIcon
                    aria-hidden="true"
                    className={`size-4 ${isCurrentStarred ? "fill-amber-500 text-amber-500" : ""}`}
                  />
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground opacity-90 shadow-2xs">
                  <RotateCwIcon aria-hidden="true" className="size-3" />
                  Flip
                </span>
              </div>
            </div>

            {/* Middle Prompt Content */}
            <div className="flex flex-1 items-center justify-center overflow-y-auto px-2 py-4">
              <div className="text-balance text-center text-xl font-semibold leading-snug text-foreground sm:text-2xl md:text-3xl">
                {renderRichCardText(activeCard.front)}
              </div>
            </div>

            {/* Bottom info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="opacity-70">Tap or press Space to flip</span>
              <kbd className="hidden rounded border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                Space
              </kbd>
            </div>
          </div>

          {/* BACK FACE (ANSWER) */}
          <div
            aria-hidden={!isFlipped}
            inert={!isFlipped ? true : undefined}
            className="absolute inset-0 flex flex-col justify-between rounded-[32px] border border-[var(--theme-primary)]/20 bg-gradient-to-b from-card via-card to-[var(--theme-soft)]/20 p-6 sm:p-10"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-primary)]/30 bg-[var(--theme-soft)] px-3 py-1 text-xs font-bold tracking-wider text-[var(--theme-primary)] uppercase">
                <CheckCircle2Icon aria-hidden="true" className="size-3.5 text-[var(--theme-primary)]" />
                Answer • Card {activeIndex + 1}
              </span>

              <div className="flex items-center gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(activeCard.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      toggleStar(activeCard.id);
                    }
                  }}
                  title={isCurrentStarred ? "Unstar card (S)" : "Star card (S)"}
                  aria-label="Star this card"
                  className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                    isCurrentStarred
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                      : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <StarIcon
                    aria-hidden="true"
                    className={`size-4 ${isCurrentStarred ? "fill-amber-500 text-amber-500" : ""}`}
                  />
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground opacity-90 shadow-2xs">
                  <RotateCwIcon aria-hidden="true" className="size-3" />
                  Flip back
                </span>
              </div>
            </div>

            {/* Middle Answer Content */}
            <div className="flex flex-1 items-center justify-center overflow-y-auto px-2 py-4">
              <div className="text-balance text-center text-lg font-normal leading-relaxed text-foreground sm:text-xl md:text-2xl">
                {renderRichCardText(activeCard.back)}
              </div>
            </div>

            {/* Bottom info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="opacity-70">Rate your recall below to advance</span>
              <kbd className="hidden rounded border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                Keys 1–4
              </kbd>
            </div>
          </div>
        </motion.button>
      </div>

      {/* ACTION & RATING CONTROLS */}
      <div className="mx-auto max-w-3xl">
        {/* If card is flipped to Answer: Show SM-2 Confidence Rating Buttons */}
        {isFlipped ? (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                How well did you remember this?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {/* Again */}
              <button
                type="button"
                onClick={() => handleRate("again")}
                className="group flex flex-col items-center justify-center gap-1 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-red-700 transition-all hover:bg-red-500/20 hover:shadow-xs active:scale-[0.98] dark:text-red-400"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Again</span>
                  <kbd className="rounded bg-red-500/20 px-1.5 py-0.2 text-[10px] font-mono">1</kbd>
                </div>
                <span className="text-[11px] opacity-80">Forgot</span>
              </button>

              {/* Hard */}
              <button
                type="button"
                onClick={() => handleRate("hard")}
                className="group flex flex-col items-center justify-center gap-1 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-amber-700 transition-all hover:bg-amber-500/20 hover:shadow-xs active:scale-[0.98] dark:text-amber-400"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Hard</span>
                  <kbd className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono">2</kbd>
                </div>
                <span className="text-[11px] opacity-80">Struggled</span>
              </button>

              {/* Good */}
              <button
                type="button"
                onClick={() => handleRate("good")}
                className="group flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-emerald-700 transition-all hover:bg-emerald-500/20 hover:shadow-xs active:scale-[0.98] dark:text-emerald-400"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Good</span>
                  <kbd className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-mono">3</kbd>
                </div>
                <span className="text-[11px] opacity-80">Remembered</span>
              </button>

              {/* Easy */}
              <button
                type="button"
                onClick={() => handleRate("easy")}
                className="group flex flex-col items-center justify-center gap-1 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-3 py-3 text-blue-700 transition-all hover:bg-blue-500/20 hover:shadow-xs active:scale-[0.98] dark:text-blue-400"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Easy</span>
                  <kbd className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-mono">4</kbd>
                </div>
                <span className="text-[11px] opacity-80">Instant recall</span>
              </button>
            </div>
          </div>
        ) : (
          /* When on Front: Standard Navigation */
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="lg"
              disabled={activeIndex === 0 || isChangingCard}
              onClick={() => changeCard(activeIndex - 1)}
              className="min-h-[46px] min-w-[120px] rounded-full font-semibold"
            >
              <ArrowLeftIcon aria-hidden="true" className="mr-1.5 size-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsFlipped(true)}
              className="min-h-[46px] rounded-full border-[var(--theme-primary)]/40 px-5 font-semibold text-[var(--theme-primary)] hover:bg-[var(--theme-soft)]"
            >
              <RotateCwIcon aria-hidden="true" className="mr-1.5 size-4" />
              Flip to Answer
            </Button>

            <Button
              size="lg"
              disabled={isChangingCard}
              onClick={() => changeCard(activeIndex + 1)}
              className="min-h-[46px] min-w-[120px] rounded-full font-semibold shadow-xs"
              style={{
                backgroundColor: "var(--theme-primary)",
                color: "var(--theme-on-primary)",
              }}
            >
              Next
              <ArrowRightIcon aria-hidden="true" className="ml-1.5 size-4" />
            </Button>
          </div>
        )}

        {/* Shortcuts reminder bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Space</kbd>
            Flip
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">←</kbd>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">→</kbd>
            Navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">S</kbd>
            Star Card
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">R</kbd>
            Read Aloud
          </span>
        </div>
      </div>
    </section>
  );
}
