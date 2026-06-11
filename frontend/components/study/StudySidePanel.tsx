"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AIStudyAssistantPanel } from "@/components/study/AIStudyAssistantPanel";
import { NotesPanel } from "@/components/study/NotesPanel";
import type { AIToolMode, StudyAIContext, StudyBubbleTab, StudyNote } from "@/types/annotations";

export function StudySidePanel({
  open,
  documentId,
  activeTab,
  onTabChange,
  selectedText,
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
  selectedText: string;
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

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          data-study-bubble="true"
          initial={isCompactLayout ? { y: 24, opacity: 0 } : { x: "100%", opacity: 0 }}
          animate={isCompactLayout ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
          exit={isCompactLayout ? { y: 24, opacity: 0 } : { x: "100%", opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="study-side-panel-shell"
          style={{
            padding: "1.3rem",
            borderRadius: "24px",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--card) 98%, white), color-mix(in srgb, var(--card) 94%, var(--theme-soft)))",
            border: "1px solid color-mix(in srgb, var(--theme-border) 58%, var(--border))",
            boxShadow: "0 20px 52px color-mix(in srgb, var(--theme-shadow) 56%, transparent)",
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

          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => onTabChange("notes")}
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
              className="study-segmented-pill"
              style={{
                backgroundColor: activeTab === "ai" ? "var(--theme-primary)" : "var(--card)",
                color: activeTab === "ai" ? "var(--theme-on-primary)" : "var(--foreground)",
              }}
            >
              AI
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "ai" ? (
              <motion.div key="ai" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                <AIStudyAssistantPanel
                  documentId={documentId}
                  context={aiContext.source ? aiContext : { source: "selection", selectedText }}
                  initialQuestion={assistantInitialQuestion}
                  mode={aiMode}
                />
              </motion.div>
            ) : (
              <motion.div key="notes" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18, ease: "easeOut" }}>
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
