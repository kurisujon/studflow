"use client";

import { useEffect, useEffectEvent, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  createAIHistory,
  deleteAIHistory,
  getAIHistory,
} from "@/lib/api/ai-history";
import { askAIAboutDocument, askAIAboutSelection } from "@/lib/api/annotations";
import { createFlashcard } from "@/lib/api/flashcards";
import type {
  AIExplanation,
  AIHistoryItem,
  AIToolMode,
  StudyAIContext,
} from "@/types/annotations";
import { useAuth } from "@clerk/nextjs";

const SOURCE_LABELS: Record<StudyAIContext["source"], string> = {
  selection: "Selection",
  highlight: "Highlight",
  underline: "Underline",
  note: "Note",
  general: "General",
};

const MODE_LABELS: Record<AIToolMode, string> = {
  "ask-ai": "Ask AI",
  simplify: "Simplify",
  "define-term": "Define Term",
};

function defaultQuestionForMode(mode: AIToolMode) {
  if (mode === "simplify") {
    return "Explain this in simpler terms.";
  }

  if (mode === "define-term") {
    return "Define this term clearly and explain how it is used in this study topic.";
  }

  return "Explain this clearly and simply for a student.";
}

function getHistorySourceText(context: StudyAIContext) {
  const selectedText = context.selectedText.trim();
  if (context.source === "general") {
    return undefined;
  }
  if (context.source === "note") {
    return selectedText || "General note";
  }
  return selectedText || undefined;
}

function getRequestSelectedText(item: AIHistoryItem | null, context: StudyAIContext) {
  if (!item) {
    return context.selectedText;
  }

  if (item.source === "note" && item.sourceText === "General note") {
    return "";
  }

  return item.sourceText ?? "";
}

function toSavedSessionResponse(item: AIHistoryItem): AIExplanation {
  return {
    historyId: item.id,
    selectedText: item.sourceText ?? "",
    simplifiedExplanation: item.answer,
    beginnerExplanation: item.answer,
    example: "",
    relatedTerms: [],
    suggestedFlashcard: {
      front: item.question ?? MODE_LABELS[item.mode],
      back: item.answer,
    },
  };
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function formatQuestionLabel(item: AIHistoryItem) {
  return item.question?.trim() || MODE_LABELS[item.mode];
}

export function AIStudyAssistantPanel({
  documentId,
  context,
  initialQuestion,
  mode,
}: {
  documentId: string;
  context: StudyAIContext;
  initialQuestion?: string;
  mode: AIToolMode;
}) {
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [historyActionError, setHistoryActionError] = useState<string | null>(null);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashcardSaveError, setFlashcardSaveError] = useState<string | null>(null);
  const [flashcardSaved, setFlashcardSaved] = useState(false);
  const [savingFlashcard, setSavingFlashcard] = useState(false);
  const [response, setResponse] = useState<AIExplanation | null>(null);
  const [history, setHistory] = useState<AIHistoryItem[]>([]);
  const [loadedHistoryItem, setLoadedHistoryItem] = useState<AIHistoryItem | null>(null);
  const [activeMode, setActiveMode] = useState<AIToolMode>(mode);
  const questionRef = useRef<HTMLTextAreaElement | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const { getToken } = useAuth();
  const router = useRouter();

  const resetPanelForContext = useEffectEvent(() => {
    setQuestion(initialQuestion ?? "");
    setLoadedHistoryItem(null);
    setResponse(null);
    setError(null);
    setHistoryActionError(null);
    setFlashcardSaveError(null);
    setFlashcardSaved(false);
    setActiveMode(mode);
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      resetPanelForContext();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [context.noteContent, context.selectedText, context.source, initialQuestion, mode]);

  useEffect(() => {
    if (context.source === "note") {
      questionRef.current?.focus();
    }
  }, [context]);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const token = await getToken({ skipCache: true });
        const items = await getAIHistory(documentId, token);
        if (mounted) {
          setHistory(items);
        }
      } catch (historyError) {
        console.error(historyError);
      } finally {
        if (mounted) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, [documentId, getToken]);

  const displayedContext = loadedHistoryItem
    ? {
        source: loadedHistoryItem.source,
        selectedText:
          loadedHistoryItem.source === "note" &&
          loadedHistoryItem.sourceText === "General note"
            ? ""
            : loadedHistoryItem.sourceText ?? "",
        noteContent: loadedHistoryItem.noteContent ?? undefined,
      }
    : context;
  const hasContext = Boolean(
    displayedContext.source === "general" ||
      displayedContext.selectedText.trim() ||
      displayedContext.noteContent?.trim(),
  );
  const placeholder =
    displayedContext.source === "general"
      ? "Ask something about the whole document..."
      : displayedContext.source === "note"
      ? "Ask something about this note..."
      : "Ask something about this text...";
  const searchValue = historySearch.trim().toLowerCase();
  const safeHistory = Array.isArray(history) ? history : [];
  const filteredHistory = safeHistory.filter((item) => {
    if (!searchValue) {
      return true;
    }

    const haystack = [
      item.sourceText ?? "",
      item.noteContent ?? "",
      item.question ?? "",
      item.answer,
      item.mode,
      SOURCE_LABELS[item.source],
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchValue);
  });

  function resetToNewQuestion() {
    setLoadedHistoryItem(null);
    setResponse(null);
    setError(null);
    setHistoryActionError(null);
    setFlashcardSaveError(null);
    setFlashcardSaved(false);
    setActiveMode(mode);
    setQuestion(initialQuestion ?? "");
    questionRef.current?.focus();
  }

  async function submit(
    customQuestion: string,
    requestedMode: AIToolMode = activeMode,
  ) {
    if (!hasContext) return;

    const resolvedQuestion =
      customQuestion.trim() || defaultQuestionForMode(requestedMode);
    const requestContext = loadedHistoryItem
      ? {
          source: loadedHistoryItem.source,
          selectedText: getRequestSelectedText(loadedHistoryItem, displayedContext),
          noteContent: loadedHistoryItem.noteContent ?? undefined,
        }
      : displayedContext;

    setActiveMode(requestedMode);
    setLoading(true);
    setError(null);
    setHistoryActionError(null);
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    try {
      const token = await getToken({ skipCache: true });
      const payload =
        requestContext.source === "general"
          ? await askAIAboutDocument(
              documentId,
              resolvedQuestion,
              token,
              {
                mode: requestedMode,
                signal: controller.signal,
              },
            )
          : await askAIAboutSelection(
              documentId,
              requestContext.selectedText,
              resolvedQuestion,
              token,
              {
                noteContent: requestContext.noteContent,
                source: requestContext.source,
                mode: requestedMode,
                signal: controller.signal,
              },
            );

      setQuestion(resolvedQuestion);
      setLoadedHistoryItem(null);
      setResponse(payload);
      setFlashcardSaveError(null);
      setFlashcardSaved(false);

      const shouldPersistQuestion =
        resolvedQuestion.trim() !== defaultQuestionForMode(requestedMode).trim();

      try {
        const savedHistory = await createAIHistory(
          documentId,
          {
            source: requestContext.source,
            sourceText: getHistorySourceText(requestContext),
            noteContent: requestContext.noteContent,
            question: shouldPersistQuestion ? resolvedQuestion : undefined,
            mode: requestedMode,
            answer: payload.simplifiedExplanation,
          },
          token,
        );

        setHistory((current) => [
          savedHistory,
          ...current.filter((item) => item.id !== savedHistory.id),
        ]);
      } catch (historySaveError) {
        console.warn("AI history could not be saved.", historySaveError);
      }
    } catch (submitError) {
      if (submitError instanceof Error && submitError.name === "AbortError") {
        setError(null);
        return;
      }
      setError(
        submitError instanceof Error
          ? submitError.message
          : "AI explanation failed.",
      );
    } finally {
      activeRequestRef.current = null;
      setLoading(false);
    }
  }

  function handleCancelRun() {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setLoading(false);
    setError(null);
  }

  function loadHistoryItem(item: AIHistoryItem) {
    setQuestion(item.question ?? "");
    setLoadedHistoryItem(item);
    setActiveMode(item.mode);
    setError(null);
    setHistoryActionError(null);
    setFlashcardSaveError(null);
    setFlashcardSaved(false);
    setResponse(toSavedSessionResponse(item));
  }

  async function handleSaveSuggestedFlashcard() {
    if (!response?.suggestedFlashcard || savingFlashcard) {
      return;
    }

    setSavingFlashcard(true);
    setFlashcardSaveError(null);

    try {
      const token = await getToken({ skipCache: true });
      await createFlashcard(
        documentId,
        {
          front: response.suggestedFlashcard.front,
          back: response.suggestedFlashcard.back,
        },
        token,
      );
      setFlashcardSaved(true);
      router.refresh();
    } catch (saveError) {
      console.error(saveError);
      setFlashcardSaveError(
        saveError instanceof Error ? saveError.message : "Flashcard could not be saved.",
      );
    } finally {
      setSavingFlashcard(false);
    }
  }

  async function handleDeleteHistory(
    event: MouseEvent<HTMLButtonElement>,
    historyId: string,
  ) {
    event.stopPropagation();
    setDeletingHistoryId(historyId);
    setHistoryActionError(null);

    try {
      const token = await getToken({ skipCache: true });
      await deleteAIHistory(historyId, token);
      setHistory((current) => current.filter((item) => item.id !== historyId));
      if (loadedHistoryItem?.id === historyId) {
        resetToNewQuestion();
      }
    } catch (deleteError) {
      console.error(deleteError);
      setHistoryActionError("History item could not be deleted.");
    } finally {
      setDeletingHistoryId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div
        className="study-support-surface"
        style={{
          padding: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "0.45rem",
            flexWrap: "wrap",
          }}
        >
          <p className="study-meta-label">
            {loadedHistoryItem
              ? "Viewing saved AI session"
              : displayedContext.source === "note"
                ? "Context from note"
                : "Context"}
          </p>
          {loadedHistoryItem ? (
            <Button
              variant="outline"
              size="sm"
              onClick={resetToNewQuestion}
              style={{ minHeight: "34px", paddingInline: "12px", borderRadius: "999px" }}
            >
              New question
            </Button>
          ) : null}
        </div>
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--theme-primary)",
            marginBottom: "0.65rem",
            fontWeight: 600,
          }}
        >
          {SOURCE_LABELS[displayedContext.source]}
        </p>
        {displayedContext.source === "note" ? (
          <div style={{ display: "grid", gap: "0.55rem" }}>
            <p className="study-body-copy" style={{ color: "var(--muted-foreground)" }}>
              <strong>Selected text:</strong>{" "}
              {displayedContext.selectedText
                ? `“${displayedContext.selectedText}”`
                : "General note"}
            </p>
            <p className="study-body-copy" style={{ color: "var(--muted-foreground)" }}>
              <strong>Your note:</strong> {displayedContext.noteContent}
            </p>
          </div>
        ) : displayedContext.source === "general" ? (
          <p className="study-body-copy" style={{ color: "var(--muted-foreground)" }}>
            Ask about the full uploaded document. Studflow will answer using the extracted document chunks.
          </p>
        ) : (
          <p className="study-body-copy" style={{ color: "var(--muted-foreground)" }}>
            {displayedContext.selectedText
              ? `“${displayedContext.selectedText}”`
              : "Select text in the reader to ask the AI tool."}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
        <Button
          variant={activeMode === "ask-ai" ? "default" : "outline"}
          onClick={() =>
            submit(question || defaultQuestionForMode("ask-ai"), "ask-ai")
          }
          disabled={!hasContext || loading}
          className="study-utility-pill"
          style={activeMode === "ask-ai" ? { color: "#ffffff" } : undefined}
        >
          Ask AI
        </Button>
        <Button
          variant={activeMode === "simplify" ? "default" : "outline"}
          onClick={() => submit(defaultQuestionForMode("simplify"), "simplify")}
          disabled={!hasContext || loading}
          className="study-utility-pill"
          style={activeMode === "simplify" ? { color: "#ffffff" } : undefined}
        >
          Simplify
        </Button>
        <Button
          variant={activeMode === "define-term" ? "default" : "outline"}
          onClick={() =>
            submit(defaultQuestionForMode("define-term"), "define-term")
          }
          disabled={!hasContext || loading}
          className="study-utility-pill"
          style={activeMode === "define-term" ? { color: "#ffffff" } : undefined}
        >
          Define Term
        </Button>
      </div>

      <label style={{ display: "grid", gap: "0.45rem" }}>
        <span className="study-meta-label">
          Ask your question
        </span>
        <textarea
          ref={questionRef}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={4}
          placeholder={initialQuestion || placeholder}
          style={{
            width: "100%",
            borderRadius: "16px",
            border: "1px solid var(--theme-border)",
            padding: "0.95rem",
            resize: "vertical",
            backgroundColor: "var(--card)",
          }}
        />
      </label>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Button
          onClick={() => submit(question)}
          disabled={!hasContext || loading}
          className="study-utility-pill"
          style={{ color: "#ffffff", flex: 1 }}
        >
          {loading ? "Running AI..." : "Run AI"}
        </Button>
        {loading ? (
          <Button
            variant="outline"
            onClick={handleCancelRun}
            className="study-utility-pill"
          >
            Cancel
          </Button>
        ) : null}
      </div>

      {error ? (
        <p style={{ color: "#b42318", fontSize: "0.92rem" }}>{error}</p>
      ) : null}
      {flashcardSaveError ? (
        <p style={{ color: "#b42318", fontSize: "0.92rem" }}>{flashcardSaveError}</p>
      ) : null}

      {response ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div
            className="study-support-surface"
            style={{
              padding: "1rem",
            }}
          >
            <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
              {activeMode === "define-term"
                ? "Definition and Usage"
                : activeMode === "simplify"
                  ? "Simplified Explanation"
                  : "Response"}
            </p>
            <p className="study-body-copy" style={{ color: "var(--foreground)" }}>
              {response.simplifiedExplanation}
            </p>
          </div>

          {activeMode === "ask-ai" && response.example ? (
            <div
              className="study-support-surface"
              style={{
                padding: "1rem",
              }}
            >
              <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
                Example
              </p>
              <p className="study-body-copy" style={{ color: "var(--foreground)" }}>
                {response.example}
              </p>
            </div>
          ) : null}

          {activeMode === "ask-ai" && response.relatedTerms.length > 0 ? (
            <div
              className="study-support-surface"
              style={{
                padding: "1rem",
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--theme-soft) 88%, white), var(--card))",
              }}
            >
              <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
                Related Terms
              </p>
              <ul
                style={{ display: "grid", gap: "0.55rem", paddingLeft: "1rem" }}
              >
                {response.relatedTerms.map((term, index) => (
                  <li
                    key={`related-${index}`}
                    className="study-body-copy"
                  >
                    {term}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {activeMode === "ask-ai" && response.keyPoints && response.keyPoints.length > 0 ? (
            <div
              className="study-support-surface"
              style={{
                padding: "1rem",
              }}
            >
              <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
                Key Points
              </p>
              <ul style={{ display: "grid", gap: "0.55rem", paddingLeft: "1rem" }}>
                {response.keyPoints.map((point, index) => (
                  <li key={`key-point-${index}`} className="study-body-copy">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {activeMode === "ask-ai" && response.sourceChunks && response.sourceChunks.length > 0 ? (
            <div
              className="study-support-surface"
              style={{
                padding: "1rem",
              }}
            >
              <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
                Grounded In These Chunks
              </p>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {response.sourceChunks.map((chunk) => (
                  <div
                    key={`chunk-${chunk.chunkIndex}-${chunk.excerpt}`}
                    className="study-empty-state"
                  >
                    <p className="study-meta-label" style={{ marginBottom: "0.35rem" }}>
                      Chunk {chunk.chunkIndex + 1}
                    </p>
                    <p className="study-body-copy" style={{ color: "var(--foreground)", marginBottom: "0.4rem" }}>
                      {chunk.excerpt}
                    </p>
                    <p className="study-body-copy" style={{ fontSize: "0.88rem" }}>
                      {chunk.relevanceReason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div
            className="study-support-surface"
            style={{
              padding: "1rem",
            }}
          >
            <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
              Suggested Flashcard
            </p>
            <div style={{ display: "grid", gap: "0.7rem" }}>
              <div>
                <p style={{ color: "var(--theme-primary)", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Front
                </p>
                <p className="study-body-copy" style={{ color: "var(--foreground)" }}>
                  {response.suggestedFlashcard.front}
                </p>
              </div>
              <div>
                <p style={{ color: "var(--theme-primary)", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Back
                </p>
                <p className="study-body-copy" style={{ color: "var(--foreground)" }}>
                  {response.suggestedFlashcard.back}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <Button
                  onClick={() => void handleSaveSuggestedFlashcard()}
                  disabled={savingFlashcard || flashcardSaved}
                  className="study-utility-pill"
                  style={{ color: "#ffffff" }}
                >
                  {savingFlashcard
                    ? "Saving..."
                    : flashcardSaved
                      ? "Saved to Flashcards"
                      : "Save as Flashcard"}
                </Button>
                {flashcardSaved ? (
                  <p className="study-body-copy" style={{ fontSize: "0.88rem" }}>
                    Open the Flashcards tab to review it.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "0.7rem",
          paddingTop: "0.8rem",
          borderTop: "1px solid var(--theme-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <p className="study-meta-label">
            Recent AI History {safeHistory.length > 0 ? `(${safeHistory.length})` : ""}
          </p>
          <input
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder="Search AI history..."
            style={{
              width: "100%",
              maxWidth: "190px",
              minHeight: "38px",
              borderRadius: "12px",
              border: "1px solid var(--theme-border)",
              paddingInline: "12px",
              backgroundColor: "var(--card)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {historyActionError ? (
          <p style={{ color: "#b42318", fontSize: "0.86rem" }}>
            {historyActionError}
          </p>
        ) : null}

        {historyLoading ? (
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
            Loading history...
          </p>
        ) : safeHistory.length === 0 ? (
          <div
            className="study-empty-state"
          >
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
              No AI history yet.
            </p>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                marginTop: "0.35rem",
              }}
            >
              Ask AI about a selected word, phrase, or note and it will appear
              here.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div
            className="study-empty-state"
          >
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
              No saved AI sessions match that search.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "0.7rem",
              maxHeight: "320px",
              overflowY: "auto",
              paddingRight: "0.1rem",
            }}
          >
            {filteredHistory.map((item) => {
              const isActive = loadedHistoryItem?.id === item.id;
              const contextPreview =
                item.sourceText ?? (item.source === "note" ? "General note" : "");

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className="study-interactive-card"
                  onClick={() => loadHistoryItem(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      loadHistoryItem(item);
                    }
                  }}
                  style={{
                    textAlign: "left",
                    padding: "0.9rem",
                    borderRadius: "16px",
                    border: isActive
                      ? "1px solid var(--theme-primary)"
                      : "1px solid var(--theme-border)",
                    backgroundColor: isActive ? "var(--theme-soft)" : "var(--card)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "grid", gap: "0.35rem", flex: 1 }}>
                      <p className="study-meta-label">
                        {SOURCE_LABELS[item.source]}
                      </p>
                      {contextPreview ? (
                        <p
                          style={{
                            color: "var(--foreground)",
                            fontWeight: 600,
                            lineHeight: 1.45,
                          }}
                        >
                          {item.source === "note" && contextPreview === "General note"
                            ? contextPreview
                            : `“${truncate(contextPreview, 90)}”`}
                        </p>
                      ) : null}
                      {item.noteContent ? (
                        <p
                          style={{
                            color: "var(--muted-foreground)",
                            fontSize: "0.82rem",
                            lineHeight: 1.5,
                          }}
                        >
                          Note: {truncate(item.noteContent, 96)}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Delete AI history item"
                      onClick={(event) => void handleDeleteHistory(event, item.id)}
                      disabled={deletingHistoryId === item.id}
                      style={{
                        minWidth: "60px",
                        height: "32px",
                        paddingInline: "0.7rem",
                        borderRadius: "10px",
                        border: "1px solid var(--theme-border)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "transparent",
                        color: "var(--muted-foreground)",
                        cursor:
                          deletingHistoryId === item.id ? "wait" : "pointer",
                        flexShrink: 0,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {deletingHistoryId === item.id ? "..." : "Delete"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: "0.35rem", marginTop: "0.7rem" }}>
                    <p
                      style={{
                        color: "var(--foreground)",
                        fontSize: "0.86rem",
                        fontWeight: 600,
                      }}
                    >
                      {formatQuestionLabel(item)}
                    </p>
                    <p
                      style={{
                        color: "var(--muted-foreground)",
                        fontSize: "0.86rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {truncate(item.answer, 140)}
                    </p>
                    <p
                      style={{
                        color: "var(--theme-primary)",
                        fontSize: "0.78rem",
                      }}
                    >
                      Updated {new Date(item.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
