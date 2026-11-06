"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Bot, ChevronDown, ChevronUp, MessageSquareText } from "lucide-react";

import { AIStudyAssistantPanel } from "@/components/study/AIStudyAssistantPanel";
import { NotesPanel } from "@/components/study/NotesPanel";
import type { AIToolMode, StudyAIContext, StudyBubbleTab, StudyNote } from "@/types/annotations";

export function StudySidePanel({
  open,
  onToggleOpen,
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
  onToggleOpen?: () => void;
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

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
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

  function openWithTab(tab: StudyBubbleTab) {
    onTabChange(tab);
    if (!open && onToggleOpen) {
      onToggleOpen();
    }
  }

  return (
    <div className="study-left-sidebar-wrapper" data-open={open ? "true" : "false"}>
      {!open ? (
        <aside
          aria-label="Collapsed AI and Notes sidebar"
          data-study-bubble="true"
          className="study-left-sidebar-collapsed"
        >
          <button
            type="button"
            onClick={() => openWithTab("ai")}
            className="study-collapsed-rail-btn study-collapsed-rail-btn-primary"
            aria-label="Expand AI Study Assistant (1/4 container size)"
            title="Open AI Chatbot (1/4 split view)"
          >
            <span className="study-collapsed-rail-icon">
              <Bot size={18} />
            </span>
            <span className="study-collapsed-rail-label">AI Chatbot</span>
          </button>

          <button
            type="button"
            onClick={() => openWithTab("notes")}
            className="study-collapsed-rail-btn"
            aria-label="Expand Notes sidebar (1/4 container size)"
            title="Open Study Notes"
          >
            <span className="study-collapsed-rail-icon">
              <MessageSquareText size={16} />
            </span>
            <span className="study-collapsed-rail-label">Notes</span>
            {notes.length > 0 ? (
              <span className="study-collapsed-rail-badge">{notes.length}</span>
            ) : null}
          </button>
        </aside>
      ) : null}

      <aside
        id={`study-side-panel-${documentId}`}
        aria-label="Notes and AI study tools"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        data-study-bubble="true"
        hidden={!open}
        className="study-side-panel-shell"
      >
        <div className="study-side-panel-topbar">
          <div role="tablist" aria-label="Study tools" className="study-side-panel-tabs">
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
              data-active={activeTab === "ai" ? "true" : "false"}
            >
              <Bot size={15} />
              <span>AI Assistant</span>
            </button>
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
              data-active={activeTab === "notes" ? "true" : "false"}
            >
              <MessageSquareText size={14} />
              <span>Notes</span>
              {notes.length > 0 ? (
                <span className="study-tab-count-pill">{notes.length}</span>
              ) : null}
            </button>
          </div>

          <div className="study-side-panel-actions">
            {onToggleOpen ? (
              <button
                type="button"
                onClick={onToggleOpen}
                className="study-panel-collapse-btn"
                aria-label="Collapse AI and Notes sidebar"
                title="Collapse sidebar to 100% summary"
              >
                <span>Collapse</span>
                {isCompactLayout ? <ChevronUp size={15} /> : <ChevronDown size={15} className="-rotate-90" />}
              </button>
            ) : null}
          </div>
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
      </aside>
    </div>
  );
}
