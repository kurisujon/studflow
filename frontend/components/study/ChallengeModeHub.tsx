"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { StudyQuizQuestion } from "@/lib/types";

export function ChallengeModeHub({
  questions,
}: {
  questions: StudyQuizQuestion[];
}) {
  const PASSING_SCORE_RATIO = 0.7;
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showScore, setShowScore] = useState(false);
  const hasCelebratedRef = useRef(false);

  const hasQuestions = questions.length > 0;
  const question = hasQuestions ? questions[activeIndex] : null;
  const selectedIndex = selectedAnswers[activeIndex];
  const answered = selectedIndex !== undefined;
  const isCorrect =
    question !== null && answered && selectedIndex === question.correct_answer_index;
  const score = questions.reduce((total, currentQuestion, index) => {
    return total + Number(selectedAnswers[index] === currentQuestion.correct_answer_index);
  }, 0);
  const passingScore = Math.ceil(questions.length * PASSING_SCORE_RATIO);
  const passed = score >= passingScore;

  useEffect(() => {
    if (!showScore || !passed || hasCelebratedRef.current) {
      return;
    }

    let isMounted = true;

    import("canvas-confetti").then((module) => {
      if (!isMounted) return;

      hasCelebratedRef.current = true;
      const confetti = module.default;

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
      });
    });

    return () => {
      isMounted = false;
    };
  }, [passed, showScore]);

  useEffect(() => {
    function handleQuizShortcuts(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)) ||
        showScore ||
        question === null
      ) {
        return;
      }

      const numericKey = Number.parseInt(event.key, 10);
      if (!Number.isNaN(numericKey) && numericKey >= 1 && numericKey <= 4) {
        const optionIndex = numericKey - 1;
        if (question.options[optionIndex] !== undefined && !answered) {
          event.preventDefault();
          setSelectedAnswers((current) => ({
            ...current,
            [activeIndex]: optionIndex,
          }));
        }
        return;
      }

      if (event.key === "Enter" && answered) {
        event.preventDefault();

        if (activeIndex === questions.length - 1) {
          setShowScore(true);
          return;
        }

        setActiveIndex((current) => current + 1);
      }
    }

    window.addEventListener("keydown", handleQuizShortcuts);
    return () => {
      window.removeEventListener("keydown", handleQuizShortcuts);
    };
  }, [activeIndex, answered, question, questions.length, showScore]);

  if (!hasQuestions || question === null) {
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
          No Challenge Available
        </h2>
        <p className="study-body-copy" style={{ marginBottom: "2.5rem" }}>
          You need to generate quizzes for your documents first before you can play Challenge Mode!
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

  function handleSelectOption(optionIndex: number) {
    if (answered) {
      return;
    }

    setSelectedAnswers((current) => ({
      ...current,
      [activeIndex]: optionIndex,
    }));
  }

  function handleNext() {
    if (activeIndex === questions.length - 1) {
      setShowScore(true);
      return;
    }

    setActiveIndex((current) => current + 1);
  }

  function handleRetake() {
    window.location.reload(); // Quick way to fetch a new mixed quiz
  }

  if (showScore) {
    return (
      <motion.section
        className="study-stage-shell"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          background:
            passed
              ? "linear-gradient(180deg, color-mix(in srgb, var(--card) 98%, white), color-mix(in srgb, var(--card) 90%, var(--theme-soft)))"
              : "linear-gradient(180deg, color-mix(in srgb, var(--card) 98%, white), color-mix(in srgb, var(--muted) 70%, var(--card)))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <p className="study-meta-label" style={{ marginBottom: "0.75rem", position: "relative" }}>
          {passed ? "Challenge Complete!" : "Try Again"}
        </p>
        {passed ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              marginBottom: "0.9rem",
              padding: "0.45rem 0.75rem",
              borderRadius: "999px",
              backgroundColor: "color-mix(in srgb, var(--theme-primary) 12%, transparent)",
              color: "var(--theme-primary)",
              fontWeight: 500,
              fontSize: "0.88rem",
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Passed Challenge</span>
          </div>
        ) : null}

        <h3
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontWeight: "600",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "0.5rem",
          }}
        >
          {score} <span style={{ color: "var(--muted-foreground)" }}>/ {questions.length}</span>
        </h3>
        <p className="study-body-copy" style={{ marginBottom: "2.25rem", maxWidth: "42ch" }}>
          {passed
            ? "Excellent work! You've mastered your weakest topics."
            : "Review the materials and try again. Practice makes perfect."}
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
          <Button onClick={handleRetake} className="study-utility-pill" style={{ minWidth: "120px" }}>
            New Challenge
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="study-utility-pill"
          >
            Back to Dashboard
          </Button>
        </div>
      </motion.section>
    );
  }

  const progress = ((activeIndex + 1) / questions.length) * 100;

  return (
    <section className="study-stage-shell" style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
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
          Question {activeIndex + 1} of {questions.length}
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
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
      <p className="study-body-copy" style={{ fontSize: "0.88rem", marginBottom: "1rem" }}>
        Shortcuts: Number keys 1-4 to select. Enter to continue.
      </p>

      <div style={{ marginBottom: "2.5rem" }}>
        <h2
          style={{
            fontSize: "clamp(1.4rem, 3vw, 1.85rem)",
            fontWeight: "500",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
            marginBottom: "1.5rem",
          }}
        >
          {question.question}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = index === question.correct_answer_index;

            let backgroundColor = "transparent";
            let borderColor = "var(--border)";
            let color = "var(--foreground)";

            if (answered) {
              if (isCorrectOption) {
                backgroundColor = "color-mix(in srgb, var(--theme-primary) 8%, transparent)";
                borderColor = "var(--theme-primary)";
                color = "var(--theme-primary)";
              } else if (isSelected && !isCorrect) {
                backgroundColor = "color-mix(in srgb, var(--destructive) 8%, transparent)";
                borderColor = "var(--destructive)";
                color = "var(--destructive)";
              } else {
                borderColor = "var(--distill-border)";
                color = "var(--muted-foreground)";
              }
            } else if (isSelected) {
              borderColor = "var(--theme-primary)";
              backgroundColor = "color-mix(in srgb, var(--theme-primary) 4%, transparent)";
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectOption(index)}
                disabled={answered}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  width: "100%",
                  textAlign: "left",
                  padding: "1rem 1.25rem",
                  borderRadius: "14px",
                  border: `1px solid ${borderColor}`,
                  backgroundColor,
                  color,
                  transition: "all 0.15s ease",
                  cursor: answered ? "default" : "pointer",
                }}
                className={!answered ? "study-option-hover" : ""}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    flexShrink: 0,
                    borderRadius: "8px",
                    border: answered && (isCorrectOption || isSelected) ? "none" : `1px solid ${borderColor}`,
                    backgroundColor: answered && isCorrectOption
                      ? "var(--theme-primary)"
                      : answered && isSelected && !isCorrect
                      ? "var(--destructive)"
                      : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: answered && (isCorrectOption || isSelected) ? "white" : "inherit",
                  }}
                >
                  {index + 1}
                </div>
                <span style={{ fontSize: "1.05rem", lineHeight: 1.4 }}>{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{
          opacity: answered ? 1 : 0,
          y: answered ? 0 : 8,
          pointerEvents: answered ? "auto" : "none",
        }}
        transition={{ duration: 0.2 }}
      >
        {answered && (
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "16px",
              backgroundColor: isCorrect
                ? "color-mix(in srgb, var(--theme-primary) 6%, transparent)"
                : "color-mix(in srgb, var(--destructive) 6%, transparent)",
              border: `1px solid ${
                isCorrect
                  ? "color-mix(in srgb, var(--theme-primary) 20%, transparent)"
                  : "color-mix(in srgb, var(--destructive) 20%, transparent)"
              }`,
              marginBottom: "1.5rem",
            }}
          >
            <p
              className="study-meta-label"
              style={{
                color: isCorrect ? "var(--theme-primary)" : "var(--destructive)",
                marginBottom: "0.35rem",
              }}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </p>
            <p className="study-body-copy" style={{ fontSize: "0.95rem" }}>
              {question.explanation}
            </p>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={handleNext}
            disabled={!answered}
            className="study-utility-pill"
            style={{
              minWidth: "120px",
              backgroundColor: answered ? "var(--theme-primary)" : "var(--muted)",
              color: answered ? "white" : "var(--muted-foreground)",
            }}
          >
            {activeIndex === questions.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
