"use client";

import { Button } from "@/components/ui/button";
import type { StudyNote } from "@/types/annotations";

export function NotesPanel({
  notes,
  composerValue,
  selectedTextContext,
  onComposerChange,
  onSaveNote,
  onDeleteNote,
  onJumpToText,
  onAskAI,
}: {
  notes: StudyNote[];
  composerValue: string;
  selectedTextContext: string;
  onComposerChange: (value: string) => void;
  onSaveNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onJumpToText: (note: StudyNote) => void;
  onAskAI: (note: StudyNote) => void;
}) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSaveNote();
    }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2410c" }}>
          Notes
        </p>

        {notes.length === 0 ? (
          <div style={{ padding: "1rem", borderRadius: "18px", backgroundColor: "rgba(255,255,255,0.84)", border: "1px solid rgba(251,146,60,0.18)" }}>
            <p style={{ color: "#7c2d12" }}>No notes yet for this topic.</p>
          </div>
        ) : (
          notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => onJumpToText(note)}
              style={{
                textAlign: "left",
                padding: "1rem",
                borderRadius: "18px",
                backgroundColor: "rgba(255,255,255,0.84)",
                border: "1px solid rgba(251,146,60,0.18)",
                cursor: "pointer",
              }}
            >
              <p style={{ color: "#7c2d12", marginBottom: "0.4rem" }}>“{note.selectedText ?? "General note"}”</p>
              <p style={{ color: "#3f2a14", marginBottom: "0.65rem" }}>{note.content}</p>
              <p style={{ color: "#9a3412", fontSize: "0.82rem", marginBottom: "0.7rem" }}>
                Updated {new Date(note.updatedAt).toLocaleString()}
              </p>
              <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                <Button variant="outline" size="sm" onClick={() => onDeleteNote(note.id)} style={{ minHeight: "40px", paddingInline: "16px", borderRadius: "14px" }}>
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onAskAI(note)} style={{ minHeight: "40px", paddingInline: "16px", borderRadius: "14px" }}>
                  Ask AI
                </Button>
              </div>
            </button>
          ))
        )}
      </div>

      <div
        style={{
          marginTop: "0.25rem",
          paddingTop: "0.9rem",
          borderTop: "1px solid rgba(249,115,22,0.12)",
          display: "grid",
          gap: "0.6rem",
        }}
      >
        <p style={{ fontSize: "0.82rem", color: "#7c2d12" }}>
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
              border: "1px solid rgba(251,146,60,0.18)",
              padding: "0.9rem",
              resize: "vertical",
              backgroundColor: "rgba(255,255,255,0.86)",
            }}
          />
          <Button onClick={onSaveNote} style={{ minHeight: "42px", paddingInline: "18px", borderRadius: "14px" }}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
