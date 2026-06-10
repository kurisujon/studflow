"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { StudyNote } from "@/types/annotations";

function noteLabel(note: StudyNote) {
  return note.selectedText ? `“${note.selectedText}”` : "General note";
}

function canJumpToText(note: StudyNote) {
  return Boolean(note.annotationId && note.selectedText);
}

export function NotesPanel({
  notes,
  deletedNotes,
  focusedNoteId,
  composerValue,
  selectedTextContext,
  onComposerChange,
  onSaveNote,
  onDeleteNote,
  onRestoreNote,
  onForceDeleteNote,
  onJumpToText,
  onAskAI,
}: {
  notes: StudyNote[];
  deletedNotes: StudyNote[];
  focusedNoteId: string | null;
  composerValue: string;
  selectedTextContext: string;
  onComposerChange: (value: string) => void;
  onSaveNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onRestoreNote: (noteId: string) => void;
  onForceDeleteNote: (noteId: string) => void;
  onJumpToText: (note: StudyNote) => void;
  onAskAI: (note: StudyNote) => void;
}) {
  const [view, setView] = useState<"active" | "trash">("active");

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSaveNote();
    }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--theme-primary)" }}>
          Notes
        </p>
        <div style={{ display: "flex", gap: "0.45rem" }}>
          <Button
            variant={view === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("active")}
            style={{
              minHeight: "38px",
              minWidth: "78px",
              paddingInline: "14px",
              borderRadius: "999px",
              color: view === "active" ? "var(--theme-on-primary)" : "var(--foreground)",
            }}
          >
            Active
          </Button>
          <Button
            variant={view === "trash" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("trash")}
            style={{
              minHeight: "38px",
              minWidth: "78px",
              paddingInline: "14px",
              borderRadius: "999px",
              color: view === "trash" ? "var(--theme-on-primary)" : "var(--foreground)",
            }}
          >
            Trash {deletedNotes.length > 0 ? `(${deletedNotes.length})` : ""}
          </Button>
        </div>
      </div>

      {view === "active" ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {notes.length === 0 ? (
            <div style={{ padding: "1rem", borderRadius: "18px", backgroundColor: "var(--card)", border: "1px solid var(--theme-border)" }}>
              <p style={{ color: "var(--muted-foreground)" }}>No notes yet for this topic.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  if (canJumpToText(note)) onJumpToText(note);
                }}
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderRadius: "18px",
                  backgroundColor: focusedNoteId === note.id ? "var(--theme-soft)" : "var(--card)",
                  border: focusedNoteId === note.id ? "1px solid var(--theme-primary)" : "1px solid var(--theme-border)",
                  cursor: canJumpToText(note) ? "pointer" : "default",
                  boxShadow: focusedNoteId === note.id ? "0 14px 32px var(--theme-shadow)" : undefined,
                }}
              >
                <p style={{ color: "var(--theme-primary)", marginBottom: "0.4rem" }}>{noteLabel(note)}</p>
                <p style={{ color: "var(--foreground)", marginBottom: "0.65rem" }}>{note.content}</p>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.82rem", marginBottom: "0.7rem" }}>
                  Updated {new Date(note.updatedAt).toLocaleString()}
                </p>
                <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                  <Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); onAskAI(note); }} style={{ minHeight: "40px", paddingInline: "16px", borderRadius: "14px" }}>
                    Ask AI
                  </Button>
                  <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); onDeleteNote(note.id); }} style={{ minHeight: "40px", paddingInline: "16px", borderRadius: "14px" }}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {deletedNotes.length === 0 ? (
            <div style={{ padding: "1rem", borderRadius: "18px", backgroundColor: "var(--card)", border: "1px solid var(--theme-border)" }}>
              <p style={{ color: "var(--muted-foreground)" }}>Trash is empty.</p>
            </div>
          ) : (
            deletedNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  padding: "1rem",
                  borderRadius: "18px",
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <p style={{ color: "var(--theme-primary)", marginBottom: "0.4rem" }}>{noteLabel(note)}</p>
                <p style={{ color: "var(--foreground)", marginBottom: "0.65rem" }}>{note.content}</p>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.82rem", marginBottom: "0.7rem" }}>
                  Deleted {note.deletedAt ? new Date(note.deletedAt).toLocaleString() : "recently"}
                </p>
                <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                  <Button variant="outline" size="sm" onClick={() => onRestoreNote(note.id)} style={{ minHeight: "40px", paddingInline: "16px", borderRadius: "14px" }}>
                    Restore
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onForceDeleteNote(note.id)} style={{ minHeight: "40px", paddingInline: "16px", borderRadius: "14px" }}>
                    Delete Forever
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "0.25rem",
          paddingTop: "0.9rem",
          borderTop: "1px solid var(--theme-border)",
          display: view === "active" ? "grid" : "none",
          gap: "0.6rem",
        }}
      >
        <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>
          {selectedTextContext
            ? `Write a note about: “${selectedTextContext}”`
            : "Write a note for this topic"}
        </p>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end" }}>
          <textarea
            value={composerValue}
            onChange={(event) => onComposerChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Write a note..."
            style={{
              flex: 1,
              borderRadius: "16px",
              border: "1px solid var(--theme-border)",
              padding: "0.9rem",
              resize: "vertical",
              backgroundColor: "var(--card)",
              color: "var(--foreground)",
            }}
          />
          <Button
            onClick={onSaveNote}
            style={{
              minHeight: "42px",
              paddingInline: "18px",
              borderRadius: "14px",
              color: "var(--theme-on-primary)",
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
