"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { createQuizAttempt, getQuizAttempts } from "@/lib/api/quiz-attempts";
import type { QuizAttemptSummary, StudyQuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuizStudy({
  documentId,
  questions,
}: {
  documentId: string;
  questions: StudyQuizQuestion[];
}) {
  const PASSING_SCORE_RATIO = 0.7;
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showScore, setShowScore] = useState(false);
  const [retryQuestionIds, setRetryQuestionIds] = useState<string[] | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  
  const hasCelebratedRef = useRef(false);
  const persistedAttemptRef = useRef(false);
  
  const quizMode: "full" | "incorrect-only" = retryQuestionIds ? "incorrect-only" : "full";
  const sessionQuestions = retryQuestionIds
    ? questions.filter((currentQuestion) => retryQuestionIds.includes(currentQuestion.id))
    : questions;
  
  const hasQuestions = sessionQuestions.length > 0;
  const question = hasQuestions ? sessionQuestions[activeIndex] : null;
  const selectedIndex = selectedAnswers[activeIndex];
  const answered = selectedIndex !== undefined;
  
  const isCorrect = question !== null && answered && selectedIndex === question.correct_answer_index;
  
  const score = sessionQuestions.reduce((total, currentQuestion, index) => {
    return total + Number(selectedAnswers[index] === currentQuestion.correct_answer_index);
  }, 0);
  
  const passingScore = Math.ceil(sessionQuestions.length * PASSING_SCORE_RATIO);
  const passed = score >= passingScore;
  
  const incorrectQuestions = sessionQuestions.filter(
    (currentQuestion, index) =>
      selectedAnswers[index] !== undefined &&
      selectedAnswers[index] !== currentQuestion.correct_answer_index,
  );
  const currentIncorrectQuestionIds = incorrectQuestions.map((currentQuestion) => currentQuestion.id);

  useEffect(() => {
    let mounted = true;
    async function loadAttempts() {
      if (!isLoaded || !isSignedIn) {
        if (mounted) setAttemptsLoading(false);
        return;
      }
      setAttemptsLoading(true);
      try {
        const token = await getToken({ skipCache: true });
        const history = await getQuizAttempts(documentId, token);
        if (mounted) {
          setAttempts(history);
          setAttemptError(null);
        }
      } catch (error) {
        console.error(error);
        if (mounted) setAttemptError("Quiz history could not be loaded.");
      } finally {
        if (mounted) setAttemptsLoading(false);
      }
    }
    void loadAttempts();
    return () => { mounted = false; };
  }, [documentId, getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!showScore || !passed || hasCelebratedRef.current) return;
    let isMounted = true;
    import("canvas-confetti").then((module) => {
      if (!isMounted) return;
      hasCelebratedRef.current = true;
      const confetti = module.default;
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
    });
    return () => { isMounted = false; };
  }, [passed, showScore]);

  useEffect(() => {
    function handleQuizShortcuts(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) ||
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
          setSelectedAnswers((current) => ({ ...current, [activeIndex]: optionIndex }));
        }
        return;
      }

      if (event.key === "Enter" && answered) {
        event.preventDefault();
        if (activeIndex === sessionQuestions.length - 1) {
          setShowScore(true);
          return;
        }
        setActiveIndex((current) => current + 1);
      }
    }
    window.addEventListener("keydown", handleQuizShortcuts);
    return () => { window.removeEventListener("keydown", handleQuizShortcuts); };
  }, [activeIndex, answered, question, sessionQuestions.length, showScore]);

  useEffect(() => {
    if (!showScore || persistedAttemptRef.current || !isLoaded || !isSignedIn) return;
    persistedAttemptRef.current = true;
    async function saveAttempt() {
      try {
        const token = await getToken({ skipCache: true });
        const savedAttempt = await createQuizAttempt(
          documentId,
          { score, totalQuestions: sessionQuestions.length, incorrectQuestionIds: currentIncorrectQuestionIds },
          token,
        );
        setAttempts((current) => [savedAttempt, ...current]);
        setAttemptError(null);
      } catch (error) {
        console.error(error);
        setAttemptError("Quiz attempt could not be saved.");
      }
    }
    void saveAttempt();
  }, [currentIncorrectQuestionIds, documentId, getToken, isLoaded, isSignedIn, score, sessionQuestions.length, showScore]);

  if (!hasQuestions || question === null) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quiz</p>
        <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed rounded-xl bg-muted/30">
          <p className="text-muted-foreground">No quiz available yet.</p>
        </div>
      </div>
    );
  }

  function handleSelectOption(optionIndex: number) {
    if (answered) return;
    setSelectedAnswers((current) => ({ ...current, [activeIndex]: optionIndex }));
  }

  function handleNext() {
    if (activeIndex === sessionQuestions.length - 1) {
      setShowScore(true);
      return;
    }
    setActiveIndex((current) => current + 1);
  }

  function handleRetake() {
    setActiveIndex(0);
    setSelectedAnswers({});
    setShowScore(false);
    setRetryQuestionIds(null);
    hasCelebratedRef.current = false;
    persistedAttemptRef.current = false;
  }

  function handleRetryIncorrect() {
    if (currentIncorrectQuestionIds.length === 0) return;
    setRetryQuestionIds(currentIncorrectQuestionIds);
    setActiveIndex(0);
    setSelectedAnswers({});
    setShowScore(false);
    hasCelebratedRef.current = false;
    persistedAttemptRef.current = false;
  }

  function handleRetryFromAttempt(attempt: QuizAttemptSummary) {
    if (attempt.incorrectQuestionIds.length === 0) return;
    setRetryQuestionIds(attempt.incorrectQuestionIds);
    setActiveIndex(0);
    setSelectedAnswers({});
    setShowScore(false);
    hasCelebratedRef.current = false;
    persistedAttemptRef.current = false;
  }

  if (showScore) {
    return (
      <motion.section
        className={cn(
          "w-full max-w-3xl mx-auto flex flex-col p-6 md:p-10 rounded-2xl border",
          passed ? "bg-gradient-to-b from-card to-green-50/50 dark:to-green-950/10 border-border" : "bg-gradient-to-b from-card to-muted/50 border-border"
        )}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {quizMode === "incorrect-only" ? "Weak Topic Review" : passed ? "Quiz Complete" : "Try Again"}
        </p>
        
        {passed && (
          <div className="inline-flex items-center gap-2 self-start mb-4 px-3 py-1.5 rounded-full bg-green-100/50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-semibold">Passed</span>
          </div>
        )}
        
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Final score: {score} / {sessionQuestions.length}
        </h2>
        <p className="text-muted-foreground mb-6">
          Passing score: {passingScore} / {sessionQuestions.length}
        </p>
        <p className="text-foreground/90 max-w-prose mb-8">
          {quizMode === "incorrect-only"
            ? "You reviewed only the missed questions from the previous attempt."
            : passed
            ? "You passed. Review the material again or continue with another study session."
            : "You did not reach the passing score yet. Review the quiz again or return to the dashboard for more practice."}
        </p>
        
        {incorrectQuestions.length > 0 && (
          <div className="mb-6 p-5 rounded-xl border bg-card/50">
            <p className="text-sm font-semibold mb-2">Weak Topic Review</p>
            <p className="text-sm text-muted-foreground mb-4">
              Missed questions in this attempt: {incorrectQuestions.length}
            </p>
            <ul className="space-y-3 pl-4 list-disc text-sm">
              {incorrectQuestions.map((incorrectQuestion) => (
                <li key={incorrectQuestion.id} className="text-foreground/80 leading-relaxed">
                  {incorrectQuestion.question}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mb-10">
          {incorrectQuestions.length > 0 && (
            <Button variant="outline" onClick={handleRetryIncorrect} className="rounded-full">
              Retry Incorrect Only
            </Button>
          )}
          <Button onClick={handleRetake} className="rounded-full">
            {passed ? "Retake Quiz" : "Try Again"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded-full">
            Return to Dashboard
          </Button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Attempts {attempts.length > 0 ? `(${attempts.length})` : ""}
          </p>
          {attemptError && <p className="text-sm text-destructive">{attemptError}</p>}
          {attemptsLoading ? (
            <p className="text-sm text-muted-foreground">Loading attempt history...</p>
          ) : attempts.length === 0 ? (
            <div className="p-6 border border-dashed rounded-xl bg-muted/20 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No previous quiz attempts yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {attempts.slice(0, 5).map((attempt) => (
                <div key={attempt.id} className="p-4 rounded-xl border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {attempt.score} / {attempt.totalQuestions}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Missed {attempt.incorrectQuestionIds.length} question{attempt.incorrectQuestionIds.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(attempt.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {attempt.incorrectQuestionIds.length > 0 && (
                    <Button variant="outline" size="sm" className="rounded-full w-full md:w-auto" onClick={() => handleRetryFromAttempt(attempt)}>
                      Retry Missed
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    );
  }

  return (
    <section className="w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {quizMode === "incorrect-only" ? "Retry Incorrect Only" : "Quiz"}: Question {activeIndex + 1} of {sessionQuestions.length}
      </p>
      
      <p className="text-xs text-muted-foreground/70 mb-6">
        Shortcuts: 1-4 choose an answer. Enter moves to the next question.
      </p>

      <h2 className="text-xl md:text-2xl font-medium leading-relaxed mb-8 text-foreground">
        {question.question}
      </h2>

      <div className="flex flex-col gap-3 mb-8">
        {question.options.map((option, optionIndex) => {
          const selected = selectedIndex === optionIndex;
          const optionIsCorrect = question.correct_answer_index === optionIndex;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelectOption(optionIndex)}
              aria-keyshortcuts={`${optionIndex + 1}`}
              disabled={answered}
              className={cn(
                "text-left w-full p-4 md:px-5 md:py-4 rounded-xl border transition-colors text-base leading-relaxed",
                !answered && "bg-card border-border hover:bg-muted/50 text-foreground cursor-pointer",
                answered && optionIsCorrect && "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-900 dark:text-green-300",
                answered && selected && !optionIsCorrect && "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-300",
                answered && !selected && !optionIsCorrect && "bg-card/50 border-border/50 text-muted-foreground opacity-60",
                answered && "cursor-default"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered && !isCorrect && question.explanation && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-8 p-4 md:p-5 rounded-xl border bg-muted/30"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Explanation</p>
          <p className="text-sm md:text-base text-foreground/90 leading-relaxed">{question.explanation}</p>
        </motion.div>
      )}

      <div className="flex justify-start">
        <Button
          onClick={handleNext}
          disabled={!answered}
          className="rounded-full px-8 py-5"
        >
          {activeIndex === sessionQuestions.length - 1 ? "Show Score" : "Next Question"}
        </Button>
      </div>
    </section>
  );
}
