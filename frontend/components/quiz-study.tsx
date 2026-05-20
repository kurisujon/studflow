"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { StudyQuizQuestion } from "@/lib/types";

export function QuizStudy({
  questions,
}: {
  questions: StudyQuizQuestion[];
}) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showScore, setShowScore] = useState(false);

  if (questions.length === 0) {
    return <p>No quiz available yet.</p>;
  }

  const question = questions[activeIndex];
  const selectedIndex = selectedAnswers[activeIndex];
  const answered = selectedIndex !== undefined;
  const isCorrect = answered && selectedIndex === question.correct_answer_index;
  const score = questions.reduce((total, currentQuestion, index) => {
    return total + Number(selectedAnswers[index] === currentQuestion.correct_answer_index);
  }, 0);

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
  }

  if (showScore) {
    return (
      <section
        style={{
          border: "1px solid var(--distill-border)",
          borderRadius: "28px",
          padding: "2rem",
          backgroundColor: "rgba(255,255,255,0.84)",
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
          Quiz Complete
        </p>
        <h2 style={{ marginBottom: "0.75rem" }}>
          Final score: {score} / {questions.length}
        </h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Review the quiz again or return to the dashboard for another document.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Button onClick={handleRetake}>Retake Quiz</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        border: "1px solid var(--distill-border)",
        borderRadius: "28px",
        padding: "2rem",
        backgroundColor: "rgba(255,255,255,0.84)",
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

          let backgroundColor = "rgba(255,255,255,0.78)";
          let borderColor = "var(--distill-border)";
          let textColor = "var(--distill-text-primary)";

          if (answered && optionIsCorrect) {
            backgroundColor = "rgba(22, 163, 74, 0.12)";
            borderColor = "rgba(22, 163, 74, 0.35)";
          } else if (answered && selected && !optionIsCorrect) {
            backgroundColor = "rgba(220, 38, 38, 0.10)";
            borderColor = "rgba(220, 38, 38, 0.28)";
          } else if (selected) {
            backgroundColor = "rgba(17,17,16,0.06)";
            borderColor = "rgba(17,17,16,0.18)";
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
            backgroundColor: "rgba(249,249,248,0.92)",
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
      >
        {activeIndex === questions.length - 1 ? "Show Score" : "Next Question"}
      </Button>
    </section>
  );
}
