"use client";

import { AnimatePresence, motion } from "framer-motion";

import { AIStudyAssistantPanel } from "@/components/study/AIStudyAssistantPanel";
import { NotesPanel } from "@/components/study/NotesPanel";
import type { AIToolMode, SelectionState, StudyBubbleTab, StudyNote } from "@/types/annotations";

export function StudySidePanel({
  open,
  activeTab,
  onTabChange,
  selectedText,
  assistantInitialQuestion,
  aiMode,
  notes,
  noteComposerValue,
  selectedNoteText,
  onNoteComposerChange,
  onSaveNote,
  onDeleteNote,
  onJumpToText,
  onAskAINote,
}: {
  open: boolean;
  activeTab: StudyBubbleTab;
  onTabChange: (tab: StudyBubbleTab) => void;
  selectedText: string;
  assistantInitialQuestion?: string;
  aiMode: AIToolMode;
  notes: StudyNote[];
  noteComposerValue: string;
  selectedNoteText: string;
  onNoteComposerChange: (value: string) => void;
  onSaveNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onJumpToText: (note: StudyNote) => void;
  onAskAINote: (note: StudyNote) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          data-study-bubble="true"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "fixed",
            right: "80px",
            top: "128px",
            width: "100%",
            maxWidth: "420px",
            maxHeight: "78vh",
            padding: "1.3rem",
            borderRadius: "24px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,244,230,0.96))",
            border: "1px solid rgba(249,115,22,0.18)",
            boxShadow: "0 22px 60px rgba(249,115,22,0.08)",
            overflowY: "auto",
            zIndex: 75,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2410c", marginBottom: "0.3rem" }}>
                Message Bubble
              </p>
              <h3 style={{ color: "#2f1c0f" }}>Study tools</h3>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => onTabChange("notes")}
              style={{
                minHeight: "40px",
                paddingInline: "16px",
                borderRadius: "999px",
                border: "1px solid rgba(249,115,22,0.18)",
                backgroundColor: activeTab === "notes" ? "#111110" : "rgba(255,255,255,0.82)",
                color: activeTab === "notes" ? "#fff" : "#2f1c0f",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => onTabChange("ai")}
              style={{
                minHeight: "40px",
                paddingInline: "16px",
                borderRadius: "999px",
                border: "1px solid rgba(249,115,22,0.18)",
                backgroundColor: activeTab === "ai" ? "#111110" : "rgba(255,255,255,0.82)",
                color: activeTab === "ai" ? "#fff" : "#2f1c0f",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              AI
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "ai" ? (
              <motion.div key="ai" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                <AIStudyAssistantPanel
                  selectedText={selectedText}
                  initialQuestion={assistantInitialQuestion}
                  mode={aiMode}
                />
              </motion.div>
            ) : (
              <motion.div key="notes" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                <NotesPanel
                  notes={notes}
                  composerValue={noteComposerValue}
                  selectedTextContext={selectedNoteText}
                  onComposerChange={onNoteComposerChange}
                  onSaveNote={onSaveNote}
                  onDeleteNote={onDeleteNote}
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
