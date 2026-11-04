"use client";

import { useCallback, useEffect, useState } from "react";
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
  initialPanel,
}: {
  document: StudyDocument;
  initialTab: string;
  initialPanel?: string;
}) {
  const [currentTab, setCurrentTab] = useState<StudyTab>(initialTab === "flashcards" || initialTab === "quiz" ? initialTab : "summary");

  const navigateToTab = useCallback((tab: StudyTab) => {
    if (tab === currentTab) {
      return;
    }

    setCurrentTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    if (tab !== "summary") url.searchParams.delete("panel");
    window.history.pushState({}, "", `${url.pathname}${url.search}`);
  }, [currentTab]);

  useEffect(() => {
    const syncTab = () => {
      const tab = new URL(window.location.href).searchParams.get("tab");
      setCurrentTab(tab === "flashcards" || tab === "quiz" ? tab : "summary");
    };
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, []);

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
    <div className="flex w-full flex-1 flex-col gap-5 pb-10">
      {/* TOP BAR: MATERIAL CONTEXT + STUDY TOOLS CARDS ABOVE THE SUMMARY */}
      <aside
        aria-label="Study material and tools"
        className="flex w-full flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
          >
            <ChevronLeftIcon aria-hidden="true" className="size-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-12">
          {/* 1. STUDYING CONTAINER */}
          <section
            aria-labelledby="study-material-heading"
            className="flex flex-col justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs xl:col-span-4"
          >
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Studying
              </p>
              <div role="status">
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2Icon aria-hidden="true" className="size-3.5" />
                    Ready to study
                  </span>
                ) : isFailed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                    <AlertCircleIcon aria-hidden="true" className="size-3.5" />
                    Processing failed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
                    Processing
                  </span>
                )}
              </div>
            </div>

            {/* Document Card */}
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:border-border">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)]">
                <FileTextIcon aria-hidden="true" className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1
                  id="study-material-heading"
                  className="truncate text-sm font-semibold leading-snug text-foreground"
                  title={document.filename}
                >
                  {document.filename}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">Added {addedOn}</p>
              </div>
            </div>
          </section>

          {/* 2 & 3. TOOL GROUPS (LEARN & PRACTICE) CONTAINERS */}
          <nav
            aria-label="Study tools"
            className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:col-span-1 xl:col-span-5 xl:grid-cols-5"
          >
            {TOOL_GROUPS.map((group) => {
              const isPractice = group.label === "Practice";
              return (
                <section
                  key={group.label}
                  aria-label={group.label}
                  className={`flex flex-col justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs ${
                    isPractice ? "xl:col-span-3" : "xl:col-span-2"
                  }`}
                >
                  <div className="flex items-center justify-between px-0.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                  </div>

                  <div
                    className={`grid gap-2 ${
                      group.tools.length > 1 ? "grid-cols-2" : "grid-cols-1"
                    }`}
                  >
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
                          className={`group flex min-h-[54px] w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] ${
                            isActive
                              ? "border-[var(--theme-primary)]/50 bg-[var(--theme-soft)] text-[var(--theme-primary)] shadow-xs"
                              : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isActive
                                ? "bg-[var(--theme-primary)] text-[var(--theme-on-primary)] shadow-xs"
                                : "border border-border/50 bg-background text-muted-foreground group-hover:border-border group-hover:text-foreground"
                            }`}
                          >
                            <Icon aria-hidden="true" className="size-4" />
                          </div>

                          <span className="min-w-0 flex-1 truncate font-semibold">
                            {tool.label}
                          </span>

                          {count !== undefined ? (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                                isActive
                                  ? "bg-[var(--theme-primary)]/15 text-[var(--theme-primary)]"
                                  : "border border-border/40 bg-muted text-muted-foreground"
                              }`}
                            >
                              {count}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </nav>

          {/* 4. SHORTCUTS CONTAINER */}
          <section
            aria-label="Keyboard shortcuts"
            className="hidden flex-col justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs md:flex xl:col-span-3"
          >
            <div className="px-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Shortcuts
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center justify-between gap-1.5 rounded-xl border border-border/50 bg-muted/20 px-2.5 py-2.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground">
                <span className="flex min-w-0 items-center gap-1.5">
                  <SparklesIcon aria-hidden="true" className="size-3.5 shrink-0 text-amber-500" />
                  <span className="truncate font-medium">Summary</span>
                </span>
                <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground shadow-2xs">
                  1
                </kbd>
              </div>

              <div className="flex items-center justify-between gap-1.5 rounded-xl border border-border/50 bg-muted/20 px-2.5 py-2.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground">
                <span className="flex min-w-0 items-center gap-1.5">
                  <BrainIcon aria-hidden="true" className="size-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                  <span className="truncate font-medium">Cards</span>
                </span>
                <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground shadow-2xs">
                  2
                </kbd>
              </div>

              <div className="flex items-center justify-between gap-1.5 rounded-xl border border-border/50 bg-muted/20 px-2.5 py-2.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground">
                <span className="flex min-w-0 items-center gap-1.5">
                  <CircleHelpIcon aria-hidden="true" className="size-3.5 shrink-0 text-blue-500" />
                  <span className="truncate font-medium">Quiz</span>
                </span>
                <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground shadow-2xs">
                  3
                </kbd>
              </div>
            </div>
          </section>
        </div>
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
              <div hidden={currentTab !== "summary"} aria-hidden={currentTab !== "summary"}>
                <SummaryStudy documentId={document.id} summary={document.summary_data} initialPanel={initialPanel} active={currentTab === "summary"} />
              </div>
              <div hidden={currentTab !== "flashcards"} aria-hidden={currentTab !== "flashcards"}>
                <FlashcardStudy flashcards={document.flashcards} active={currentTab === "flashcards"} />
              </div>
              <div hidden={currentTab !== "quiz"} aria-hidden={currentTab !== "quiz"}>
                <QuizStudy documentId={document.id} questions={document.quiz} active={currentTab === "quiz"} />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
