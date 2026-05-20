"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { FloatingNotesButton } from "@/components/study/FloatingNotesButton";
import { StudySidePanel } from "@/components/study/StudySidePanel";
import { Button } from "@/components/ui/button";
import { deleteAnnotation, saveAnnotation } from "@/lib/api/annotations";
import type { StudyDocument } from "@/lib/types";
import type {
  AIToolMode,
  Annotation,
  AnnotationColor,
  SelectionState,
  StudyBubbleTab,
  StudyNote,
} from "@/types/annotations";

type SummaryData = NonNullable<StudyDocument["summary_data"]>;

const STORAGE_KEY_PREFIX = "distill-summary-annotations-v4";

const HIGHLIGHT_COLORS: AnnotationColor[] = [
  "blue",
  "yellow",
  "green",
  "pink",
  "purple",
];

const COLOR_STYLES: Record<AnnotationColor, { background: string; underline: string }> = {
  blue: { background: "rgba(96,165,250,0.24)", underline: "#60a5fa" },
  yellow: { background: "rgba(250,204,21,0.28)", underline: "#facc15" },
  green: { background: "rgba(52,211,153,0.24)", underline: "#34d399" },
  pink: { background: "rgba(251,113,133,0.22)", underline: "#fb7185" },
  purple: { background: "rgba(192,132,252,0.2)", underline: "#a78bfa" },
};

function storageKey(documentId: string) {
  return `${STORAGE_KEY_PREFIX}:${documentId}`;
}

function escapeHTML(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTextOffset(root: HTMLElement, node: Node, offset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  let total = 0;

  while (currentNode) {
    const length = currentNode.textContent?.length ?? 0;
    if (currentNode === node) {
      return total + offset;
    }
    total += length;
    currentNode = walker.nextNode();
  }

  return total;
}

function buildSelectionState(root: HTMLElement, selection: Selection): SelectionState | null {
  if (selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  if (!selectedText) return null;

  const blockElement = (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? (range.commonAncestorContainer as Element)
    : range.commonAncestorContainer.parentElement
  )?.closest<HTMLElement>("[data-annotatable-block]");

  if (!blockElement || !root.contains(blockElement)) return null;

  const blockId = blockElement.dataset.annotatableBlock;
  if (!blockId) return null;

  const startOffset = getTextOffset(blockElement, range.startContainer, range.startOffset);
  const endOffset = getTextOffset(blockElement, range.endContainer, range.endOffset);
  const rect = range.getBoundingClientRect();
  const shouldPlaceBelow = rect.top < 80;

  return {
    blockId,
    selectedText,
    startOffset,
    endOffset,
    x: rect.left + window.scrollX + rect.width / 2,
    y: shouldPlaceBelow
      ? rect.bottom + window.scrollY + 8
      : rect.top + window.scrollY - 52,
  };
}

function annotationRangeKey(annotation: Annotation) {
  return `${annotation.blockId}:${annotation.startOffset}:${annotation.endOffset}`;
}

function renderAnnotatedHTML(
  text: string,
  annotations: Annotation[],
  pendingSelection?: { startOffset: number; endOffset: number } | null,
) {
  if (annotations.length === 0) {
    if (!pendingSelection) {
      return escapeHTML(text);
    }
    return (
      escapeHTML(text.slice(0, pendingSelection.startOffset)) +
      `<span style="background:rgba(59,130,246,0.22);border-radius:0.25rem;">${escapeHTML(
        text.slice(pendingSelection.startOffset, pendingSelection.endOffset),
      )}</span>` +
      escapeHTML(text.slice(pendingSelection.endOffset))
    );
  }

  const grouped = new Map<
    string,
    {
      start: number;
      end: number;
      highlight?: Annotation;
      underline?: Annotation;
      note?: Annotation;
    }
  >();

  for (const annotation of annotations) {
    const key = annotationRangeKey(annotation);
    const current = grouped.get(key) ?? {
      start: annotation.startOffset,
      end: annotation.endOffset,
    };

    if (annotation.type === "highlight") current.highlight = annotation;
    if (annotation.type === "underline") current.underline = annotation;
    if (annotation.type === "note") current.note = annotation;

    grouped.set(key, current);
  }

  const ordered = [...grouped.values()].sort((a, b) => a.start - b.start);
  let cursor = 0;
  let html = "";

  for (const item of ordered) {
    if (item.start < cursor || item.end > text.length) continue;

    html += escapeHTML(text.slice(cursor, item.start));
    const selected = escapeHTML(text.slice(item.start, item.end));
    const styles: string[] = [];

    if (item.highlight?.color) {
      styles.push(
        `background:${COLOR_STYLES[item.highlight.color].background};border-radius:0.3rem;padding:0 0.08rem;`,
      );
    }

    if (item.underline?.underlineColor) {
      const underlineColor =
        item.underline.underlineColor === "neutral"
          ? "#525252"
          : COLOR_STYLES[item.underline.underlineColor].underline;
      styles.push(
        `text-decoration-line:underline;text-decoration-color:${underlineColor};text-decoration-thickness:2px;text-underline-offset:3px;`,
      );
    }

    html += `<span data-annotation-id="${item.note?.id ?? item.highlight?.id ?? item.underline?.id ?? ""}" style="${styles.join("")}">${selected}${item.note ? `<sup data-note-id="${item.note.id}" style="margin-left:0.22rem;color:#c2410c;font-weight:700;cursor:pointer;">●</sup>` : ""}</span>`;
    cursor = item.end;
  }

  html += escapeHTML(text.slice(cursor));
  return html;
}

function formatTerm(term: string) {
  const separator = term.includes(":") ? ":" : term.includes(" - ") ? " - " : null;
  if (!separator) return { label: term, definition: "" };
  const [label, ...rest] = term.split(separator);
  return { label: label.trim(), definition: rest.join(separator).trim() };
}

function renderTermHTML(
  text: string,
  annotations: Annotation[],
  pendingSelection?: { startOffset: number; endOffset: number } | null,
) {
  const formatted = formatTerm(text);
  const combined = formatted.definition ? `${formatted.label}: ${formatted.definition}` : formatted.label;
  const rawHTML = renderAnnotatedHTML(combined, annotations, pendingSelection);
  const escapedLabel = escapeHTML(formatted.label);

  if (!formatted.definition) {
    return `<strong style="color:#9a3412;">${rawHTML}</strong>`;
  }

  return rawHTML.replace(
    escapedLabel,
    `<strong style="color:#9a3412;">${escapedLabel}</strong>`,
  );
}

function makeAnnotation(
  documentId: string,
  selection: SelectionState,
  type: "highlight" | "underline" | "note",
  color?: AnnotationColor,
  noteContent?: string,
): Annotation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    documentId,
    selectedText: selection.selectedText,
    startOffset: selection.startOffset,
    endOffset: selection.endOffset,
    blockId: selection.blockId,
    type,
    color,
    underlineColor: type === "underline" ? color ?? "blue" : undefined,
    noteContent,
    createdAt: now,
    updatedAt: now,
  };
}

export function InteractiveSummaryReader({
  documentId,
  summary,
}: {
  documentId: string;
  summary: SummaryData | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null);
  const [pendingSelection, setPendingSelection] = useState<SelectionState | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBubbleTab, setActiveBubbleTab] = useState<StudyBubbleTab>("notes");
  const [assistantInitialQuestion, setAssistantInitialQuestion] = useState("");
  const [aiMode, setAiMode] = useState<AIToolMode>("ask-ai");
  const [activeHighlightColor, setActiveHighlightColor] = useState<AnnotationColor>("blue");
  const [underlineColorMode, setUnderlineColorMode] = useState(false);
  const [noteComposerValue, setNoteComposerValue] = useState("");
  const [pulseAnnotationId, setPulseAnnotationId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectionPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(documentId));
      if (raw) {
        setAnnotations(JSON.parse(raw) as Annotation[]);
      }
    } catch {
      setAnnotations([]);
    }
  }, [documentId]);

  useEffect(() => {
    window.localStorage.setItem(storageKey(documentId), JSON.stringify(annotations));
  }, [annotations, documentId]);

  useEffect(() => {
    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target as Node;

      const clickedInsideSelectionPopover =
        selectionPopoverRef.current?.contains(target) ?? false;
      const clickedInsideMessageBubble =
        target instanceof HTMLElement &&
        Boolean(target.closest("[data-study-bubble-head]"));
      const clickedInsideStudyBubblePanel =
        target instanceof HTMLElement &&
        Boolean(target.closest("[data-study-bubble]"));

      if (clickedInsideSelectionPopover || clickedInsideMessageBubble || clickedInsideStudyBubblePanel) {
        return;
      }

      if (pendingSelection) {
        clearPendingSelection();
      }

      if (drawerOpen) {
        setDrawerOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        clearPendingSelection();
        setDrawerOpen(false);
      }
    }

    function handleShortcuts(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.altKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        setDrawerOpen((current) => !current);
      }
    }

    window.addEventListener("pointerdown", handleDocumentPointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("keydown", handleShortcuts);
    return () => {
      window.removeEventListener("pointerdown", handleDocumentPointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("keydown", handleShortcuts);
    };
  }, [drawerOpen, pendingSelection]);

  if (!summary || summary.detailed_sections.length === 0) {
    return <p>No summary available yet.</p>;
  }

  const sections = summary.detailed_sections;
  const activeSection = sections[activeIndex];
  const progress = ((activeIndex + 1) / sections.length) * 100;
  const pendingSelectionForBlock = (blockId: string) =>
    pendingSelection?.blockId === blockId
      ? {
          startOffset: pendingSelection.startOffset,
          endOffset: pendingSelection.endOffset,
        }
      : null;

  const topicAnnotations = annotations.filter((annotation) => {
    return (
      annotation.blockId === `overview-${activeIndex}` ||
      annotation.blockId.startsWith(`point-${activeIndex}-`) ||
      annotation.blockId.startsWith(`term-${activeIndex}-`)
    );
  });

  const topicNotes = notes.filter((note) => note.topicIndex === activeIndex || note.topicIndex === undefined);

  function commit(next: Annotation[]) {
    setUndoStack((current) => [...current, annotations]);
    setRedoStack([]);
    setAnnotations(next);
  }

  function clearPendingSelection() {
    window.getSelection()?.removeAllRanges();
    setSelectionState(null);
    setPendingSelection(null);
    setUnderlineColorMode(false);
  }

  function saveHighlight(color: AnnotationColor) {
    if (!pendingSelection) return;

    const existing = annotations.find(
      (annotation) =>
        annotation.type === "highlight" &&
        annotation.blockId === pendingSelection.blockId &&
        annotation.startOffset === pendingSelection.startOffset &&
        annotation.endOffset === pendingSelection.endOffset,
    );

    if (existing && existing.color === color) {
      commit(annotations.filter((annotation) => annotation.id !== existing.id));
      void deleteAnnotation(existing.id);
      clearPendingSelection();
      return;
    }

    const created = makeAnnotation(documentId, pendingSelection, "highlight", color);
    commit([
      ...annotations.filter(
        (annotation) =>
          !(
            annotation.type === "highlight" &&
            annotation.blockId === pendingSelection.blockId &&
            annotation.startOffset === pendingSelection.startOffset &&
            annotation.endOffset === pendingSelection.endOffset
          ),
      ),
      created,
    ]);
    void saveAnnotation(created);
    clearPendingSelection();
  }

  function saveUnderline(color: AnnotationColor) {
    if (!pendingSelection) return;

    const existing = annotations.find(
      (annotation) =>
        annotation.type === "underline" &&
        annotation.blockId === pendingSelection.blockId &&
        annotation.startOffset === pendingSelection.startOffset &&
        annotation.endOffset === pendingSelection.endOffset,
    );

    if (existing && existing.underlineColor === color) {
      commit(annotations.filter((annotation) => annotation.id !== existing.id));
      void deleteAnnotation(existing.id);
      clearPendingSelection();
      return;
    }

    const created = makeAnnotation(documentId, pendingSelection, "underline", color);
    commit([
      ...annotations.filter(
        (annotation) =>
          !(
            annotation.type === "underline" &&
            annotation.blockId === pendingSelection.blockId &&
            annotation.startOffset === pendingSelection.startOffset &&
            annotation.endOffset === pendingSelection.endOffset
          ),
      ),
      created,
    ]);
    void saveAnnotation(created);
    clearPendingSelection();
  }

  function saveNote() {
    if (!noteComposerValue.trim()) return;

    const now = new Date().toISOString();
    const selected = selectionState ?? pendingSelection;
    const note: StudyNote = {
      id: crypto.randomUUID(),
      annotationId: selected ? crypto.randomUUID() : undefined,
      documentId,
      topicIndex: activeIndex,
      selectedText: selected?.selectedText,
      content: noteComposerValue.trim(),
      createdAt: now,
      updatedAt: now,
    };

    setNotes((current) => [...current, note]);

    if (selected) {
      const noteAnnotation = makeAnnotation(
        documentId,
        selected,
        "note",
        undefined,
        note.content,
      );
      noteAnnotation.id = note.annotationId ?? noteAnnotation.id;
      commit([...annotations, noteAnnotation]);
      void saveAnnotation(noteAnnotation);
    }

    setNoteComposerValue("");
    clearPendingSelection();
  }

  function deleteNote(noteId: string) {
    const note = notes.find((item) => item.id === noteId);
    setNotes((current) => current.filter((item) => item.id !== noteId));
    if (note?.annotationId) {
      commit(annotations.filter((annotation) => annotation.id !== note.annotationId));
      void deleteAnnotation(note.annotationId);
    }
  }

  function jumpToText(note: StudyNote) {
    if (!note.annotationId) return;
    const element = rootRef.current?.querySelector<HTMLElement>(
      `[data-annotation-id="${note.annotationId}"]`,
    );
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setPulseAnnotationId(note.annotationId);
    window.setTimeout(() => setPulseAnnotationId(null), 1200);
  }

  function undo() {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((current) => [...current, annotations]);
    setUndoStack((current) => current.slice(0, -1));
    setAnnotations(previous);
  }

  function redo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((current) => [...current, annotations]);
    setRedoStack((current) => current.slice(0, -1));
    setAnnotations(next);
  }

  function handleSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !rootRef.current) return;
    const state = buildSelectionState(rootRef.current, selection);
    if (!state) return;
    setSelectionState(state);
    setPendingSelection(state);
  }

  function renderPoint(point: string, index: number) {
    const blockId = `point-${activeIndex}-${index}`;
    const blockAnnotations = topicAnnotations.filter((annotation) => annotation.blockId === blockId);
    const pulse = blockAnnotations.some((annotation) => annotation.id === pulseAnnotationId);
    return (
      <li
        key={`${activeSection.topic_title}-point-${index}`}
        data-annotatable-block={blockId}
        dangerouslySetInnerHTML={{
          __html: renderAnnotatedHTML(
            point,
            blockAnnotations,
            pendingSelectionForBlock(blockId),
          ),
        }}
        style={{ userSelect: "text", animation: pulse ? "notePulse 1s ease-out" : undefined }}
      />
    );
  }

  function renderTerm(term: string, index: number) {
    const blockId = `term-${activeIndex}-${index}`;
    const blockAnnotations = topicAnnotations.filter((annotation) => annotation.blockId === blockId);
    const pulse = blockAnnotations.some((annotation) => annotation.id === pulseAnnotationId);
    return (
      <li
        key={`${activeSection.topic_title}-term-${index}`}
        data-annotatable-block={blockId}
        dangerouslySetInnerHTML={{
          __html: renderTermHTML(
            term,
            blockAnnotations,
            pendingSelectionForBlock(blockId),
          ),
        }}
        style={{ userSelect: "text", animation: pulse ? "notePulse 1s ease-out" : undefined }}
      />
    );
  }

  function openNotesFromPendingSelection() {
    if (!pendingSelection) return;
    setDrawerOpen(true);
    setActiveBubbleTab("notes");
  }

  function openAIFromPendingSelection(mode: AIToolMode) {
    if (!pendingSelection) return;
    setSelectionState(pendingSelection);
    setDrawerOpen(true);
    setActiveBubbleTab("ai");
    setAiMode(mode);
    setAssistantInitialQuestion(
      mode === "simplify"
        ? "Explain this in simpler terms."
        : mode === "define-term"
          ? "Define this term clearly and explain how it is used in this study topic."
          : "",
    );
  }

  function handleBubbleHeadClick() {
    setDrawerOpen((current) => !current);
  }

  return (
    <section style={{ width: "100%", display: "block" }}>
      <div ref={rootRef} onMouseUp={handleSelection} style={{ cursor: "text" }}>
        <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              padding: "1.4rem",
              borderRadius: "24px",
              background:
                "linear-gradient(135deg, rgba(255,247,237,0.95), rgba(255,255,255,0.96))",
              border: "1px solid rgba(251, 191, 36, 0.25)",
              boxShadow: "0 18px 48px rgba(245, 158, 11, 0.08)",
            }}
          >
            <p
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#b45309",
                marginBottom: "0.55rem",
              }}
            >
              Overall Overview
            </p>
            <p
              data-annotatable-block={`overview-${activeIndex}`}
              dangerouslySetInnerHTML={{
                __html: renderAnnotatedHTML(
                  summary.overall_overview,
                  topicAnnotations.filter(
                    (annotation) => annotation.blockId === `overview-${activeIndex}`,
                  ),
                  pendingSelectionForBlock(`overview-${activeIndex}`),
                ),
              }}
              style={{
                fontFamily: '"Geist", "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                fontSize: "1.05rem",
                lineHeight: 1.85,
                color: "#3f2a14",
                userSelect: "text",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                fontSize: "0.82rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#9a3412",
              }}
            >
              Topic {activeIndex + 1} of {sections.length}
            </p>
            <div
              style={{
                flex: 1,
                minWidth: "180px",
                maxWidth: "320px",
                height: "8px",
                borderRadius: "999px",
                backgroundColor: "rgba(251,191,36,0.18)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #f59e0b, #f97316, #ef4444)",
                }}
              />
            </div>
          </div>
        </div>

        <article
          style={{
            maxWidth: "760px",
            marginInline: "auto",
            padding: "2rem",
            borderRadius: "30px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,240,0.94))",
            border: "1px solid rgba(249,115,22,0.18)",
            boxShadow: "0 24px 64px rgba(249,115,22,0.08)",
          }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c2410c",
              marginBottom: "0.7rem",
            }}
          >
            Detailed Topic
          </p>
          <h2
            style={{
              fontFamily: '"Geist", "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 1.2,
              fontWeight: 700,
              color: "#2f1c0f",
              marginBottom: "1.3rem",
            }}
          >
            {activeSection.topic_title}
          </h2>

          <div style={{ display: "grid", gap: "1.4rem" }}>
            <div>
              <p
                style={{
                  fontSize: "0.78rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#ea580c",
                  marginBottom: "0.85rem",
                }}
              >
                Key Points
              </p>
              <AnimatePresence mode="wait">
                <motion.ul
                  key={`topic-points-${activeIndex}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{
                    display: "grid",
                    gap: "0.85rem",
                    paddingLeft: "1.2rem",
                    fontFamily: '"Geist", "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                    fontSize: "1.04rem",
                    lineHeight: 1.9,
                    color: "#3f2a14",
                  }}
                >
                  {activeSection.key_points.map(renderPoint)}
                </motion.ul>
              </AnimatePresence>
            </div>

            {activeSection.important_terms_and_definitions.length > 0 ? (
              <div
                style={{
                  padding: "1.2rem 1.25rem",
                  borderRadius: "22px",
                  background:
                    "linear-gradient(135deg, rgba(255,237,213,0.92), rgba(255,255,255,0.96))",
                  border: "1px solid rgba(251,146,60,0.22)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.78rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#c2410c",
                    marginBottom: "0.85rem",
                  }}
                >
                  Important Terms and Definitions
                </p>
                <AnimatePresence mode="wait">
                  <motion.ul
                    key={`topic-terms-${activeIndex}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    style={{
                      display: "grid",
                      gap: "0.7rem",
                      paddingLeft: 0,
                      listStyle: "none",
                      fontFamily: '"Geist", "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                      fontSize: "1rem",
                      lineHeight: 1.8,
                      color: "#4a2d1c",
                    }}
                  >
                    {activeSection.important_terms_and_definitions.map(renderTerm)}
                  </motion.ul>
                </AnimatePresence>
              </div>
            ) : null}
          </div>
        </article>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "1rem",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((current) => current - 1)}
            >
              Previous Topic
            </Button>
            <Button
              disabled={activeIndex === sections.length - 1}
              onClick={() => setActiveIndex((current) => current + 1)}
            >
              Next Topic
            </Button>
          </div>

          <FloatingNotesButton
            count={notes.length}
            behindDrawer={drawerOpen}
            onClick={handleBubbleHeadClick}
          />
        </div>

        <AnimatePresence>
          {pendingSelection ? (
            <motion.div
              ref={selectionPopoverRef}
              data-highlight-popover="true"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
              style={{
                position: "fixed",
                top: pendingSelection.y,
                left:
                  typeof window !== "undefined"
                    ? Math.min(Math.max(pendingSelection.x, 220), window.innerWidth - 220)
                    : pendingSelection.x,
                transform: "translateX(-50%)",
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 0.65rem",
                borderRadius: "16px",
                backgroundColor: "rgba(28,25,23,0.96)",
                boxShadow: "0 16px 34px rgba(17,17,16,0.24)",
              }}
            >
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => saveHighlight(color)}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "999px",
                    border:
                      activeHighlightColor === color
                        ? "2px solid rgba(255,255,255,0.95)"
                        : "1px solid rgba(255,255,255,0.45)",
                    backgroundColor:
                      color === "blue"
                        ? "#60a5fa"
                        : color === "yellow"
                          ? "#facc15"
                          : color === "green"
                            ? "#34d399"
                            : color === "pink"
                              ? "#fb7185"
                              : "#c084fc",
                    cursor: "pointer",
                  }}
                />
              ))}
              <div style={{ position: "relative" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUnderlineColorMode((current) => !current)}
                  style={{ minHeight: "36px", paddingInline: "14px", borderRadius: "12px" }}
                >
                  Underline
                </Button>
                {underlineColorMode ? (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: "0.4rem",
                      padding: "0.45rem 0.5rem",
                      borderRadius: "14px",
                      backgroundColor: "rgba(28,25,23,0.96)",
                      boxShadow: "0 14px 32px rgba(17,17,16,0.24)",
                    }}
                  >
                    {[...HIGHLIGHT_COLORS, "neutral" as const].map((color) => (
                      <button
                        key={`u-${color}`}
                        type="button"
                        onClick={() => saveUnderline(color === "neutral" ? "blue" : color)}
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "999px",
                          border: "1px solid rgba(255,255,255,0.45)",
                          backgroundColor:
                            color === "blue"
                              ? "#60a5fa"
                              : color === "yellow"
                                ? "#facc15"
                                : color === "green"
                                  ? "#34d399"
                                  : color === "pink"
                                    ? "#fb7185"
                                    : color === "purple"
                                      ? "#c084fc"
                                      : "#525252",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={openNotesFromPendingSelection}
                style={{ minHeight: "36px", paddingInline: "14px", borderRadius: "12px" }}
              >
                Add to Note
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openAIFromPendingSelection("ask-ai")}
                style={{ minHeight: "36px", paddingInline: "14px", borderRadius: "12px" }}
              >
                Ask AI
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPendingSelection}
                style={{
                  minHeight: "36px",
                  paddingInline: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backgroundColor: "transparent",
                  color: "#e5e7eb",
                }}
              >
                Cancel
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <StudySidePanel
        open={drawerOpen}
        activeTab={activeBubbleTab}
        onTabChange={setActiveBubbleTab}
        selectedText={selectionState?.selectedText ?? pendingSelection?.selectedText ?? ""}
        assistantInitialQuestion={assistantInitialQuestion}
        aiMode={aiMode}
        notes={topicNotes}
        noteComposerValue={noteComposerValue}
        selectedNoteText={selectionState?.selectedText ?? pendingSelection?.selectedText ?? ""}
        onNoteComposerChange={setNoteComposerValue}
        onSaveNote={saveNote}
        onDeleteNote={deleteNote}
        onJumpToText={jumpToText}
        onAskAINote={(note) => {
          setDrawerOpen(true);
          setActiveBubbleTab("ai");
          setAiMode("ask-ai");
          setSelectionState(
            note.annotationId
              ? (() => {
                  const annotation = annotations.find((item) => item.id === note.annotationId);
                  return annotation
                    ? {
                        blockId: annotation.blockId,
                        selectedText: annotation.selectedText,
                        startOffset: annotation.startOffset,
                        endOffset: annotation.endOffset,
                        x: 0,
                        y: 0,
                      }
                    : null;
                })()
              : null,
          );
        }}
      />
    </section>
  );
}
