"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { FlashcardStudy } from "@/components/flashcard-study";
import { QuizStudy } from "@/components/quiz-study";
import { SummaryStudy } from "@/components/summary-study";
import { RetryDocumentButton } from "@/components/retry-document-button";
import type { StudyDocument } from "@/lib/types";
import {
  FileTextIcon,
  BrainIcon,
  CircleHelpIcon,
  SparklesIcon,
  ChevronLeftIcon,
  CheckCircle2Icon,
  Loader2Icon,
  AlertCircleIcon,
} from "@/components/home/icon-registry";

type StudyTab = "summary" | "flashcards" | "quiz";

type IconComponent = typeof SparklesIcon;

const TOOL_GROUPS: Array<{
  label: string;
  tools: Array<{ key: StudyTab; label: string; title: string; shortcut: string; icon: IconComponent }>;
}> = [
  {
    label: "Learn",
    tools: [
      { key: "summary", label: "Summary", title: "Study guide & summary", shortcut: "1", icon: SparklesIcon },
    ],
  },
  {
    label: "Practice",
    tools: [
      { key: "flashcards", label: "Flashcards", title: "Flashcards", shortcut: "2", icon: BrainIcon },
      { key: "quiz", label: "Quiz", title: "Quiz", shortcut: "3", icon: CircleHelpIcon },
    ],
  },
];

const ALL_TOOLS = TOOL_GROUPS.flatMap((group) => group.tools);

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable)
  );
}

export function StudyWorkspace({
  document,
  initialTab,
}: {
  document: StudyDocument;
  initialTab: string;
}) {
  const router = useRouter();
  const currentTab: StudyTab =
    initialTab === "flashcards" || initialTab === "quiz" ? initialTab : "summary";

  const navigateToTab = useCallback((tab: StudyTab) => {
    if (tab === currentTab) {
      return;
    }

    router.push(`/dashboard/study/${document.id}?tab=${tab}`);
  }, [currentTab, document.id, router]);

  useEffect(() => {
    function handleStudyTabShortcuts(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTypingTarget(event.target) ||
        currentTab === "quiz"
      ) {
        return;
      }

      if (event.key === "1") {
        event.preventDefault();
        navigateToTab("summary");
        return;
      }

      if (event.key === "2") {
        event.preventDefault();
        navigateToTab("flashcards");
        return;
      }

      if (event.key === "3") {
        event.preventDefault();
        navigateToTab("quiz");
      }
    }

    window.addEventListener("keydown", handleStudyTabShortcuts);
    return () => {
      window.removeEventListener("keydown", handleStudyTabShortcuts);
    };
  }, [currentTab, navigateToTab]);

  const isFailed = document.status === "FAILED";
  const isCompleted = document.status === "COMPLETED";
  const isProcessing = !isFailed && !isCompleted;
  const activeTool = ALL_TOOLS.find((tool) => tool.key === currentTab) ?? ALL_TOOLS[0];
  const ActiveIcon = activeTool.icon;

  const counts: Partial<Record<StudyTab, number>> = {
    flashcards: document.flashcards?.length ?? 0,
    quiz: document.quiz?.length ?? 0,
  };

  const addedOn = new Date(document.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex w-full flex-1 flex-col gap-5 pb-10 lg:flex-row lg:items-start lg:gap-8">
      {/* MATERIAL CONTEXT + STUDY TOOLS */}
      <aside
        aria-label="Study material and tools"
        className="flex w-full shrink-0 flex-col gap-6 lg:sticky lg:top-6 lg:w-64 xl:w-72 lg:gap-8"
      >
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
        >
          <ChevronLeftIcon aria-hidden="true" className="mr-1 size-4" />
          Back to Dashboard
        </Link>

        {/* Active source */}
        <section
          aria-labelledby="study-material-heading"
          className="flex flex-col gap-3 px-1"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Studying
          </p>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)]">
              <FileTextIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <h1
                id="study-material-heading"
                className="break-words text-sm font-semibold leading-snug text-foreground line-clamp-3 lg:text-base"
                title={document.filename}
              >
                {document.filename}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">Added {addedOn}</p>
            </div>
          </div>

          <div className="mt-1" role="status">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2Icon aria-hidden="true" className="size-3.5" />
                Ready to study
              </span>
            ) : isFailed ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertCircleIcon aria-hidden="true" className="size-3.5" />
                Processing failed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
                Processing
              </span>
            )}
          </div>
        </section>

        {/* Study tools */}
        <nav
          aria-label="Study tools"
          className="flex gap-1 overflow-x-auto lg:flex-col"
        >
          {TOOL_GROUPS.map((group) => (
            <div key={group.label} className="contents lg:block lg:mb-6 lg:last:mb-0">
              <p className="hidden px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:block">
                {group.label}
              </p>
              <div className="flex gap-1 lg:flex-col">
                {group.tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = currentTab === tool.key;
                  const count = counts[tool.key];
                  return (
                    <button
                      key={tool.key}
                      type="button"
                      onClick={() => navigateToTab(tool.key)}
                      aria-current={isActive ? "page" : undefined}
                      aria-keyshortcuts={tool.shortcut}
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] lg:w-full lg:gap-3 lg:py-2.5 ${
                        isActive
                          ? "bg-[var(--theme-soft)] text-[var(--theme-primary)]"
                          : "text-muted-foreground hover:bg-[var(--theme-soft)]/50 hover:text-foreground"
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {tool.label}
                      {count !== undefined ? (
                        <span
                          className={`ml-1 rounded-full px-1.5 text-xs font-medium tabular-nums lg:ml-auto ${
                            isActive ? "bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <p className="hidden px-2 text-xs text-muted-foreground lg:block">
          Shortcuts:{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans text-[10px]">1</kbd> Summary,{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans text-[10px]">2</kbd> Flashcards,{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans text-[10px]">3</kbd> Quiz
        </p>
      </aside>

      {/* MAIN WORKSPACE */}
      <section
        aria-labelledby="study-workspace-heading"
        className="flex min-h-[480px] w-full min-w-0 flex-1 flex-col rounded-xl border border-[var(--theme-border)] bg-[var(--card)] lg:rounded-2xl"
      >
        <header className="flex items-center gap-2 rounded-t-xl border-b border-[var(--theme-border)] px-4 py-3 lg:rounded-t-2xl lg:px-6 lg:py-4">
          <ActiveIcon aria-hidden="true" className="size-4 text-[var(--theme-primary)] lg:size-5" />
          <h2 id="study-workspace-heading" className="text-base font-semibold text-foreground lg:text-lg">
            {activeTool.title}
          </h2>
        </header>

        <div className="flex flex-1 flex-col">
          {isProcessing ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center" role="status">
              <Loader2Icon aria-hidden="true" className="size-8 animate-spin text-[var(--theme-primary)]" />
              <div>
                <p className="text-base font-semibold text-foreground">This material is still being processed</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Your summary, flashcards, and quiz will appear here once processing finishes. Refresh this page in a moment to check again.
                </p>
              </div>
            </div>
          ) : isFailed ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <AlertCircleIcon aria-hidden="true" className="size-8 text-destructive" />
              <div>
                <p className="text-base font-semibold text-foreground">We couldn&apos;t process this material</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Study tools are unavailable until processing succeeds.
                </p>
              </div>
              <div className="w-full max-w-xs">
                <RetryDocumentButton documentId={document.id} />
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4 md:p-6 lg:p-8">
              {currentTab === "summary" ? (
                <SummaryStudy documentId={document.id} summary={document.summary_data} />
              ) : null}
              {currentTab === "flashcards" ? (
                <FlashcardStudy flashcards={document.flashcards} />
              ) : null}
              {currentTab === "quiz" ? (
                <QuizStudy documentId={document.id} questions={document.quiz} />
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
