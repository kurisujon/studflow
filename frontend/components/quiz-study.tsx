"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { StudyQuizQuestion } from "@/lib/types";

export function QuizStudy({
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

  if (!hasQuestions || question === null) {
    return <p>No quiz available yet.</p>;
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
    setActiveIndex(0);
    setSelectedAnswers({});
    setShowScore(false);
    hasCelebratedRef.current = false;
  }

  if (showScore) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          border: "1px solid var(--distill-border)",
          borderRadius: "28px",
          padding: "2rem",
          background:
            passed
              ? "linear-gradient(180deg, var(--card), var(--theme-soft))"
              : "linear-gradient(180deg, var(--card), var(--muted))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--distill-text-muted)",
            marginBottom: "0.75rem",
            position: "relative",
          }}
        >
          {passed ? "Quiz Complete" : "Try Again"}
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
              backgroundColor: "rgba(22,163,74,0.10)",
              border: "1px solid rgba(22,163,74,0.18)",
              color: "#166534",
              position: "relative",
            }}
          >
            <CheckCircle2 size={16} />
            <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>Passed</span>
          </div>
        ) : null}
        <h2 style={{ marginBottom: "0.75rem", position: "relative" }}>
          Final score: {score} / {questions.length}
        </h2>
        <p style={{ marginBottom: "0.45rem", position: "relative" }}>
          Passing score: {passingScore} / {questions.length}
        </p>
        <p style={{ marginBottom: "1.5rem", position: "relative" }}>
          {passed
            ? "You passed. Review the material again or continue with another study session."
            : "You did not reach the passing score yet. Review the quiz again or return to the dashboard for more practice."}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Button
            onClick={handleRetake}
            style={{ minHeight: "42px", paddingInline: "18px", borderRadius: "14px" }}
          >
            {passed ? "Retake Quiz" : "Try Again"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            style={{ minHeight: "42px", paddingInline: "18px", borderRadius: "14px" }}
          >
            Return to Dashboard
          </Button>
        </div>
      </motion.section>
    );
  }

  return (
    <section
      style={{
        border: "1px solid var(--distill-border)",
        borderRadius: "28px",
        padding: "2rem",
        backgroundColor: "var(--card)",
        color: "var(--foreground)",
      }}
    >
      <p
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--distill-text-muted)",
          marginBottom: "0.75rem",
        }}
      >
        Question {activeIndex + 1} of {questions.length}
      </p>

      <h2 style={{ marginBottom: "1.25rem", lineHeight: 1.35 }}>
        {question.question}
      </h2>

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {question.options.map((option, optionIndex) => {
          const selected = selectedIndex === optionIndex;
          const optionIsCorrect = question.correct_answer_index === optionIndex;

          let backgroundColor = "var(--card)";
          let borderColor = "var(--distill-border)";
          let textColor = "var(--distill-text-primary)";

          if (answered && optionIsCorrect) {
            backgroundColor = "rgba(22, 163, 74, 0.12)";
            borderColor = "rgba(22, 163, 74, 0.35)";
          } else if (answered && selected && !optionIsCorrect) {
            backgroundColor = "rgba(220, 38, 38, 0.10)";
            borderColor = "rgba(220, 38, 38, 0.28)";
          } else if (selected) {
            backgroundColor = "var(--theme-soft)";
            borderColor = "var(--theme-border)";
            textColor = "var(--distill-text-primary)";
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelectOption(optionIndex)}
              style={{
                textAlign: "left",
                width: "100%",
                padding: "1rem 1.05rem",
                borderRadius: "18px",
                border: `1px solid ${borderColor}`,
                backgroundColor,
                color: textColor,
                cursor: answered ? "default" : "pointer",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered && !isCorrect ? (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "1rem",
            borderRadius: "18px",
            border: "1px solid var(--distill-border)",
            backgroundColor: "var(--muted)",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--distill-text-muted)",
              marginBottom: "0.45rem",
            }}
          >
            Explanation
          </p>
          <p>{question.explanation}</p>
        </div>
      ) : null}

      <Button
        onClick={handleNext}
        disabled={!answered}
        style={{
          minHeight: "42px",
          minWidth: activeIndex === questions.length - 1 ? "126px" : "146px",
          paddingInline: "18px",
          borderRadius: "14px",
          whiteSpace: "nowrap",
        }}
      >
        {activeIndex === questions.length - 1 ? "Show Score" : "Next Question"}
      </Button>
    </section>
  );
}
