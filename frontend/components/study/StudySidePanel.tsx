"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";

import { AIStudyAssistantPanel } from "@/components/study/AIStudyAssistantPanel";
import { NotesPanel } from "@/components/study/NotesPanel";
import type { AIToolMode, StudyAIContext, StudyBubbleTab, StudyNote } from "@/types/annotations";

export function StudySidePanel({
  open,
  documentId,
  activeTab,
  onTabChange,
  aiContext,
  assistantInitialQuestion,
  aiMode,
  notes,
  deletedNotes,
  focusedNoteId,
  noteComposerValue,
  noteComposerTextareaId,
  selectedNoteText,
  onNoteComposerChange,
  onSaveNote,
  onDeleteNote,
  onRestoreNote,
  onForceDeleteNote,
  onJumpToText,
  onAskAINote,
}: {
  open: boolean;
  documentId: string;
  activeTab: StudyBubbleTab;
  onTabChange: (tab: StudyBubbleTab) => void;
  aiContext: StudyAIContext;
  assistantInitialQuestion?: string;
  aiMode: AIToolMode;
  notes: StudyNote[];
  deletedNotes: StudyNote[];
  focusedNoteId: string | null;
  noteComposerValue: string;
  noteComposerTextareaId?: string;
  selectedNoteText: string;
  onNoteComposerChange: (value: string) => void;
  onSaveNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onRestoreNote: (noteId: string) => void;
  onForceDeleteNote: (noteId: string) => void;
  onJumpToText: (note: StudyNote) => void;
  onAskAINote: (note: StudyNote) => void;
}) {
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [aiInitialized, setAiInitialized] = useState(open && activeTab === "ai");

  useEffect(() => {
    if (open && activeTab === "ai") window.requestAnimationFrame(() => setAiInitialized(true));
  }, [activeTab, open]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const syncLayout = () => setIsCompactLayout(mediaQuery.matches);
    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncLayout);
    };
  }, []);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: StudyBubbleTab) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next: StudyBubbleTab = event.key === "Home"
      ? "notes"
      : event.key === "End"
        ? "ai"
        : current === "notes" ? "ai" : "notes";
    onTabChange(next);
    requestAnimationFrame(() => document.getElementById(`study-${next}-tab-${documentId}`)?.focus());
  }

  return (
        <motion.aside
          id={`study-side-panel-${documentId}`}
          aria-label="Notes and AI study tools"
          aria-hidden={!open}
          inert={!open ? true : undefined}
          data-study-bubble="true"
          initial={false}
          animate={open
            ? isCompactLayout ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }
            : isCompactLayout ? { y: 24, opacity: 0 } : { x: "100%", opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="study-side-panel-shell"
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: "1.3rem",
            borderRadius: "24px",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--card) 98%, white), color-mix(in srgb, var(--card) 94%, var(--theme-soft)))",
            border: "1px solid color-mix(in srgb, var(--theme-border) 58%, var(--border))",
            boxShadow: "0 20px 52px color-mix(in srgb, var(--theme-shadow) 56%, transparent)",
            pointerEvents: open ? "auto" : "none",
            visibility: open ? "visible" : "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <p className="study-meta-label" style={{ marginBottom: "0.3rem" }}>
                Study Panel
              </p>
              <h3 style={{ color: "var(--foreground)" }}>Notes and AI</h3>
            </div>
          </div>

          <div role="tablist" aria-label="Study tools" style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => onTabChange("notes")}
              role="tab"
              id={`study-notes-tab-${documentId}`}
              aria-selected={activeTab === "notes"}
              aria-controls={`study-notes-panel-${documentId}`}
              tabIndex={activeTab === "notes" ? 0 : -1}
              onKeyDown={(event) => handleTabKeyDown(event, "notes")}
              className="study-segmented-pill"
              style={{
                backgroundColor: activeTab === "notes" ? "var(--theme-primary)" : "var(--card)",
                color: activeTab === "notes" ? "var(--theme-on-primary)" : "var(--foreground)",
              }}
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => onTabChange("ai")}
              role="tab"
              id={`study-ai-tab-${documentId}`}
              aria-selected={activeTab === "ai"}
              aria-controls={`study-ai-panel-${documentId}`}
              tabIndex={activeTab === "ai" ? 0 : -1}
              onKeyDown={(event) => handleTabKeyDown(event, "ai")}
              className="study-segmented-pill"
              style={{
                backgroundColor: activeTab === "ai" ? "var(--theme-primary)" : "var(--card)",
                color: activeTab === "ai" ? "var(--theme-on-primary)" : "var(--foreground)",
              }}
            >
              AI
            </button>
          </div>

          <div className="study-side-panel-content">
            <div role="tabpanel" id={`study-ai-panel-${documentId}`} aria-labelledby={`study-ai-tab-${documentId}`} className="study-side-tab-panel" hidden={!open || activeTab !== "ai"} inert={!open || activeTab !== "ai" ? true : undefined}>
              {aiInitialized ? (
                <AIStudyAssistantPanel
                  documentId={documentId}
                  context={aiContext}
                  initialQuestion={assistantInitialQuestion}
                  mode={aiMode}
                />
              ) : null}
            </div>
            <div role="tabpanel" id={`study-notes-panel-${documentId}`} aria-labelledby={`study-notes-tab-${documentId}`} className="study-side-tab-panel study-side-notes-panel" hidden={!open || activeTab !== "notes"} inert={!open || activeTab !== "notes" ? true : undefined}>
                <NotesPanel
                  notes={notes}
                  deletedNotes={deletedNotes}
                  focusedNoteId={focusedNoteId}
                  composerValue={noteComposerValue}
                  composerTextareaId={noteComposerTextareaId}
                  selectedTextContext={selectedNoteText}
                  onComposerChange={onNoteComposerChange}
                  onSaveNote={onSaveNote}
                  onDeleteNote={onDeleteNote}
                  onRestoreNote={onRestoreNote}
                  onForceDeleteNote={onForceDeleteNote}
                  onJumpToText={onJumpToText}
                  onAskAI={onAskAINote}
                />
            </div>
          </div>
        </motion.aside>
  );
}
