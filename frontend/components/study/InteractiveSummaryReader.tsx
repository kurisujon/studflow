"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { AnnotatableTextBlock } from "@/components/study/AnnotatableTextBlock";
import { FloatingNotesButton } from "@/components/study/FloatingNotesButton";
import { RelatedLearningVideos } from "@/components/study/RelatedLearningVideos";
import { StudySidePanel } from "@/components/study/StudySidePanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import {
  createAnnotation,
  deleteAnnotation,
  getAnnotations,
  updateAnnotation,
  type CreateAnnotationPayload,
} from "@/lib/api/annotations";
import {
  createNote,
  forceDeleteNote,
  getNotes,
  restoreNote,
  softDeleteNote,
} from "@/lib/api/notes";
import type { StudyDocument } from "@/lib/types";
import type {
  AIToolMode,
  Annotation,
  AnnotationColor,
  AnnotationType,
  SelectionState,
  StudyAIContext,
  StudyBubbleTab,
  StudyNote,
  TextSelectionPayload,
  UnderlineColor,
} from "@/types/annotations";

type SummaryData = NonNullable<StudyDocument["summary_data"]>;

const HIGHLIGHT_COLORS: AnnotationColor[] = [
  "blue",
  "yellow",
  "green",
  "pink",
  "purple",
];

function formatTerm(term: string) {
  const separator = term.includes(":") ? ":" : term.includes(" - ") ? " - " : null;
  if (!separator) return { label: term, definition: "" };
  const [label, ...rest] = term.split(separator);
  return { label: label.trim(), definition: rest.join(separator).trim() };
}

function makeAnnotation(
  documentId: string,
  selection: SelectionState,
  type: "highlight" | "underline" | "note",
  color?: AnnotationColor | UnderlineColor,
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
    color: type === "highlight" && color !== "neutral" ? color : undefined,
    underlineColor: type === "underline" ? color ?? "blue" : undefined,
    noteContent,
    createdAt: now,
    updatedAt: now,
  };
}

function getTopicIndexFromBlockId(blockId: string) {
  const [, topicIndex] = blockId.split("-");
  const parsed = Number.parseInt(topicIndex ?? "", 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function annotationToNote(annotation: Annotation): StudyNote {
  return {
    id: annotation.id,
    annotationId: annotation.id,
    documentId: annotation.documentId,
    topicIndex: getTopicIndexFromBlockId(annotation.blockId),
    blockId: annotation.blockId,
    startOffset: annotation.startOffset,
    endOffset: annotation.endOffset,
    selectedText: annotation.selectedText || undefined,
    content: annotation.noteContent ?? "",
    deletedAt: annotation.deletedAt ?? null,
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt,
  };
}

function annotationPayload(annotation: Annotation): CreateAnnotationPayload {
  return {
    blockId: annotation.blockId,
    selectedText: annotation.selectedText,
    startOffset: annotation.startOffset,
    endOffset: annotation.endOffset,
    type: annotation.type,
    color: annotation.color,
    underlineColor: annotation.underlineColor,
    noteContent: annotation.noteContent,
  };
}

function rangesOverlap(
  first: Pick<Annotation, "startOffset" | "endOffset">,
  second: Pick<Annotation, "startOffset" | "endOffset">,
) {
  return first.startOffset < second.endOffset && first.endOffset > second.startOffset;
}

function getOverlapLength(
  first: Pick<Annotation, "startOffset" | "endOffset">,
  second: Pick<SelectionState, "startOffset" | "endOffset">,
) {
  return Math.max(
    0,
    Math.min(first.endOffset, second.endOffset) -
      Math.max(first.startOffset, second.startOffset),
  );
}

export function InteractiveSummaryReader({
  documentId,
  summary,
}: {
  documentId: string;
  summary: SummaryData | null;
}) {
  const noteComposerTextareaId = `study-note-composer-${documentId}`;
  const [activeIndex, setActiveIndex] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null);
  const [pendingSelection, setPendingSelection] = useState<SelectionState | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBubbleTab, setActiveBubbleTab] = useState<StudyBubbleTab>("notes");
  const [assistantInitialQuestion, setAssistantInitialQuestion] = useState("");
  const [aiMode, setAiMode] = useState<AIToolMode>("ask-ai");
  const [aiContextText, setAiContextText] = useState("");
  const [aiContext, setAiContext] = useState<StudyAIContext>({
    source: "selection",
    selectedText: "",
  });
  const [activeHighlightColor] = useState<AnnotationColor>("blue");
  const [underlineColorMode, setUnderlineColorMode] = useState(false);
  const [noteComposerValue, setNoteComposerValue] = useState("");
  const [noteContextText, setNoteContextText] = useState("");
  const [deletedNotes, setDeletedNotes] = useState<StudyNote[]>([]);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [pulseAnnotationId, setPulseAnnotationId] = useState<string | null>(null);
  const [annotationError, setAnnotationError] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectionPopoverRef = useRef<HTMLDivElement | null>(null);

  const { getToken, isLoaded, isSignedIn } = useAuth();

  function handleTextSelection(payload: TextSelectionPayload) {
    const state: SelectionState = {
      blockId: payload.blockId,
      selectedText: payload.selectedText,
      startOffset: payload.startOffset,
      endOffset: payload.endOffset,
      x: payload.rect.left + payload.rect.width / 2,
      y: payload.rect.top,
    };
    setSelectionState(state);
    setPendingSelection(state);
  }

  useEffect(() => {
    let mounted = true;

    if (!isLoaded) {
      return () => {
        mounted = false;
      };
    }

    if (!isSignedIn) {
      return () => {
        mounted = false;
      };
    }

    getToken({ skipCache: true })
      .then((token) => {
        if (!mounted) return;
        if (!token) {
          throw new Error("Missing Clerk session token.");
        }

        return Promise.all([
          getAnnotations(documentId, token),
          getNotes(documentId, token, true),
        ]);
      })
      .then((result) => {
        if (!mounted || !result) return;

        const [annotationData, noteData] = result;
        setAnnotations(annotationData);
        const allNotes = noteData.map(annotationToNote);
        setNotes(allNotes.filter((note) => !note.deletedAt));
        setDeletedNotes(allNotes.filter((note) => Boolean(note.deletedAt)));
        setAnnotationError(null);
      })
      .catch((error) => {
        console.error(error);
        if (mounted) {
          setAnnotationError("Saved annotations could not be loaded.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [documentId, getToken, isLoaded, isSignedIn]);

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
        event.defaultPrevented ||
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
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        setDrawerOpen(true);
        setActiveBubbleTab("ai");
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        setDrawerOpen(true);
        setActiveBubbleTab("notes");
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setDrawerOpen(true);
        setActiveBubbleTab("notes");
        window.requestAnimationFrame(() => {
          document.getElementById(noteComposerTextareaId)?.focus();
        });
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
  }, [drawerOpen, noteComposerTextareaId, pendingSelection]);

  if (!summary || summary.detailed_sections.length === 0) {
    return <p>No summary available yet.</p>;
  }

  const activeSummary = summary;
  const sections = summary.detailed_sections;
  const activeSection = sections[activeIndex];
  const progress = ((activeIndex + 1) / sections.length) * 100;
  const overviewBlockId = "overview";
  const titleBlockId = `topic-${activeIndex}-title`;
  const pendingSelectionForBlock = (blockId: string) =>
    pendingSelection?.blockId === blockId
      ? {
          startOffset: pendingSelection.startOffset,
          endOffset: pendingSelection.endOffset,
        }
      : null;

  const topicAnnotations = annotations.filter((annotation) => {
    return (
      annotation.blockId === overviewBlockId ||
      annotation.blockId === titleBlockId ||
      annotation.blockId.startsWith(`topic-${activeIndex}-keypoint-`) ||
      annotation.blockId.startsWith(`topic-${activeIndex}-term-`)
    );
  });

  const topicNotes = notes.filter((note) => note.topicIndex === activeIndex || note.topicIndex === undefined);

  function commit(next: Annotation[]) {
    setAnnotations(next);
  }

  function getPlainTextForBlock(blockId: string) {
    if (blockId === overviewBlockId) {
      return activeSummary.overall_overview;
    }

    if (blockId === titleBlockId) {
      return activeSection.topic_title;
    }

    const pointMatch = blockId.match(/^topic-(\d+)-keypoint-(\d+)$/);
    if (pointMatch) {
      const [, topicIndex, pointIndex] = pointMatch;
      return sections[Number(topicIndex)]?.key_points[Number(pointIndex)] ?? null;
    }

    const termMatch = blockId.match(/^topic-(\d+)-term-(\d+)$/);
    if (termMatch) {
      const [, topicIndex, termIndex] = termMatch;
      const term = sections[Number(topicIndex)]?.important_terms_and_definitions[Number(termIndex)];
      if (!term) return null;
      const formatted = formatTerm(term);
      return formatted.definition ? `${formatted.label}: ${formatted.definition}` : formatted.label;
    }

    return null;
  }

  function isValidSelection(selection: SelectionState) {
    const blockText = getPlainTextForBlock(selection.blockId);
    if (!blockText) return false;

    return blockText.slice(selection.startOffset, selection.endOffset) === selection.selectedText;
  }

  function clearPendingSelection() {
    window.getSelection()?.removeAllRanges();
    setSelectionState(null);
    setPendingSelection(null);
    setUnderlineColorMode(false);
  }

  function findBestOverlappingAnnotation(type: AnnotationType, selection: SelectionState) {
    return annotations.filter(
      (annotation) =>
        annotation.type === type &&
        annotation.blockId === selection.blockId &&
        rangesOverlap(annotation, selection),
    ).sort(
      (first, second) =>
        getOverlapLength(second, selection) - getOverlapLength(first, selection),
    )[0];
  }

  function buildAIContextFromSelection(selection: SelectionState): StudyAIContext {
    const highlight = findBestOverlappingAnnotation("highlight", selection);
    const underline = findBestOverlappingAnnotation("underline", selection);
    const matchedAnnotation = [highlight, underline]
      .filter((annotation): annotation is Annotation => Boolean(annotation))
      .sort(
        (first, second) =>
          getOverlapLength(second, selection) - getOverlapLength(first, selection),
      )[0];

    return {
      source:
        matchedAnnotation?.type === "highlight" || matchedAnnotation?.type === "underline"
          ? matchedAnnotation.type
          : "selection",
      selectedText: selection.selectedText,
    };
  }

  function saveRangeAnnotation(type: "highlight", color: AnnotationColor): void;
  function saveRangeAnnotation(type: "underline", color: UnderlineColor): void;
  function saveRangeAnnotation(type: "highlight" | "underline", color: AnnotationColor | UnderlineColor) {
    if (!pendingSelection) return;

    if (!isValidSelection(pendingSelection)) {
      console.warn("Annotation offset mismatch", {
        blockId: pendingSelection.blockId,
        selectedText: pendingSelection.selectedText,
        startOffset: pendingSelection.startOffset,
        endOffset: pendingSelection.endOffset,
      });
      setAnnotationError("Selection could not be saved. Try selecting the text again.");
      clearPendingSelection();
      return;
    }

    const annotationToUpdate = findBestOverlappingAnnotation(type, pendingSelection);
    const updateHasSameColor =
      type === "highlight"
        ? annotationToUpdate?.color === color
        : annotationToUpdate?.underlineColor === color;

    if (annotationToUpdate && updateHasSameColor) {
      const previousAnnotations = annotations;
      setAnnotations((current) =>
        current.filter((annotation) => annotation.id !== annotationToUpdate.id),
      );

      void getToken({ skipCache: true })
        .then((token) => deleteAnnotation(annotationToUpdate.id, token))
        .then(() => {
          setAnnotationError(null);
        })
        .catch((error) => {
          console.error(error);
          setAnnotations(previousAnnotations);
          setAnnotationError(`${type === "highlight" ? "Highlight" : "Underline"} could not be removed.`);
        });

      clearPendingSelection();
      return;
    }

    if (annotationToUpdate) {
      const previousAnnotations = annotations;
      const optimistic =
        type === "highlight"
          ? { ...annotationToUpdate, color: color as AnnotationColor, updatedAt: new Date().toISOString() }
          : { ...annotationToUpdate, underlineColor: color as UnderlineColor, updatedAt: new Date().toISOString() };
      setAnnotations((current) =>
        current.map((annotation) =>
          annotation.id === annotationToUpdate.id ? optimistic : annotation,
        ),
      );
      void getToken({ skipCache: true })
        .then((token) =>
          updateAnnotation(
            annotationToUpdate.id,
            type === "highlight"
              ? { color: color as AnnotationColor }
              : { underlineColor: color as UnderlineColor },
            token,
          ),
        )
        .then((saved) => {
          setAnnotations((current) =>
            current.map((annotation) =>
              annotation.id === annotationToUpdate.id ? saved : annotation,
            ),
          );
          setAnnotationError(null);
        })
        .catch((error) => {
          console.error(error);
          setAnnotations(previousAnnotations);
          setAnnotationError(`${type === "highlight" ? "Highlight" : "Underline"} could not be saved.`);
        });
      clearPendingSelection();
      return;
    }

    const created = makeAnnotation(documentId, pendingSelection, type, color);
    const previousAnnotations = annotations;
    commit([...annotations, created]);

    void getToken({ skipCache: true })
      .then((token) => createAnnotation(documentId, annotationPayload(created), token))
      .then((saved) => {
        setAnnotations((current) =>
          current.map((annotation) => annotation.id === created.id ? saved : annotation),
        );
        setAnnotationError(null);
      })
      .catch((error) => {
        console.error(error);
        setAnnotations(previousAnnotations);
        setAnnotationError(`${type === "highlight" ? "Highlight" : "Underline"} could not be saved.`);
      });

    clearPendingSelection();
  }

  function saveHighlight(color: AnnotationColor) {
    saveRangeAnnotation("highlight", color);
  }

  function saveUnderline(color: UnderlineColor) {
    saveRangeAnnotation("underline", color);
  }

  function saveNote() {
    if (!noteComposerValue.trim()) return;

    const selected = selectionState ?? pendingSelection;
    const noteAnnotation = selected
      ? makeAnnotation(
        documentId,
        selected,
        "note",
        undefined,
        noteComposerValue.trim(),
      )
      : makeAnnotation(
        documentId,
        {
          blockId: `topic-${activeIndex}-general-note`,
          selectedText: "",
          startOffset: 0,
          endOffset: 0,
          x: 0,
          y: 0,
        },
        "note",
        undefined,
        noteComposerValue.trim(),
      );
    const optimisticNote = annotationToNote(noteAnnotation);
    const previousAnnotations = annotations;
    const previousNotes = notes;

    setAnnotations((current) => [...current, noteAnnotation]);
    setNotes((current) => [...current, optimisticNote]);

    void getToken({ skipCache: true })
      .then((token) => createNote(documentId, annotationPayload(noteAnnotation), token))
      .then((saved) => {
        setAnnotations((current) =>
          current.map((annotation) => annotation.id === noteAnnotation.id ? saved : annotation),
        );
        setNotes((current) =>
          current.map((note) => note.id === optimisticNote.id ? annotationToNote(saved) : note),
        );
        setAnnotationError(null);
      })
      .catch((error) => {
        console.error(error);
        setAnnotations(previousAnnotations);
        setNotes(previousNotes);
        setAnnotationError("Note could not be saved.");
      });

    setNoteComposerValue("");
    setNoteContextText("");
    clearPendingSelection();
  }

  function deleteNote(noteId: string) {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;

    const previousAnnotations = annotations;
    const previousNotes = notes;
    const previousDeletedNotes = deletedNotes;
    const deletedAt = new Date().toISOString();
    const deletedNote = { ...note, deletedAt, updatedAt: deletedAt };
    setNotes((current) => current.filter((item) => item.id !== noteId));
    setDeletedNotes((current) => [deletedNote, ...current]);
    if (note?.annotationId) {
      commit(annotations.filter((annotation) => annotation.id !== note.annotationId));
      void getToken({ skipCache: true })
        .then((token) => softDeleteNote(note.annotationId!, token))
        .catch((error) => {
          console.error(error);
          setAnnotations(previousAnnotations);
          setNotes(previousNotes);
          setDeletedNotes(previousDeletedNotes);
          setAnnotationError("Note could not be deleted.");
        });
    }
  }

  function restoreDeletedNote(noteId: string) {
    const note = deletedNotes.find((item) => item.id === noteId);
    if (!note?.annotationId) return;

    const previousAnnotations = annotations;
    const previousNotes = notes;
    const previousDeletedNotes = deletedNotes;
    setDeletedNotes((current) => current.filter((item) => item.id !== noteId));

    void getToken({ skipCache: true })
      .then((token) => restoreNote(note.annotationId!, token))
      .then((restored) => {
        const restoredNote = annotationToNote(restored);
        setNotes((current) => [restoredNote, ...current]);
        if (restored.selectedText) {
          setAnnotations((current) => [...current.filter((item) => item.id !== restored.id), restored]);
        }
        setAnnotationError(null);
      })
      .catch((error) => {
        console.error(error);
        setAnnotations(previousAnnotations);
        setNotes(previousNotes);
        setDeletedNotes(previousDeletedNotes);
        setAnnotationError("Note could not be restored.");
      });
  }

  function permanentlyDeleteNote(noteId: string) {
    const note = deletedNotes.find((item) => item.id === noteId);
    if (!note?.annotationId) return;

    const previousDeletedNotes = deletedNotes;
    setDeletedNotes((current) => current.filter((item) => item.id !== noteId));

    void getToken({ skipCache: true })
      .then((token) => forceDeleteNote(note.annotationId!, token))
      .catch((error) => {
        console.error(error);
        setDeletedNotes(previousDeletedNotes);
        setAnnotationError("Note could not be permanently deleted.");
      });
  }

  function jumpToText(note: StudyNote) {
    if (!note.annotationId || !note.selectedText) return;
    const element = rootRef.current?.querySelector<HTMLElement>(
      `[data-annotation-id="${note.annotationId}"]`,
    );
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setDrawerOpen(true);
    setActiveBubbleTab("notes");
    setFocusedNoteId(note.id);
    setPulseAnnotationId(note.annotationId);
    window.setTimeout(() => {
      setPulseAnnotationId(null);
      setFocusedNoteId(null);
    }, 1200);
  }

  function handleNoteMarkerClick(annotationId: string) {
    const note = notes.find((item) => item.annotationId === annotationId);
    if (!note) return;
    setDrawerOpen(true);
    setActiveBubbleTab("notes");
    setFocusedNoteId(note.id);
    setPulseAnnotationId(annotationId);
    window.setTimeout(() => {
      setPulseAnnotationId(null);
      setFocusedNoteId(null);
    }, 1200);
  }

  function renderPoint(point: string, index: number) {
    const blockId = `topic-${activeIndex}-keypoint-${index}`;
    const blockAnnotations = topicAnnotations.filter((annotation) => annotation.blockId === blockId);
    const pulse = blockAnnotations.some((annotation) => annotation.id === pulseAnnotationId);
    return (
      <AnnotatableTextBlock
        key={`${activeSection.topic_title}-point-${index}`}
        as="li"
        blockId={blockId}
        text={point}
        annotations={blockAnnotations}
        pendingSelection={pendingSelectionForBlock(blockId)}
        pulse={pulse}
        onSelection={handleTextSelection}
        onNoteClick={handleNoteMarkerClick}
      />
    );
  }

  function renderTerm(term: string, index: number) {
    const blockId = `topic-${activeIndex}-term-${index}`;
    const blockAnnotations = topicAnnotations.filter((annotation) => annotation.blockId === blockId);
    const pulse = blockAnnotations.some((annotation) => annotation.id === pulseAnnotationId);
    const formatted = formatTerm(term);
    const text = formatted.definition ? `${formatted.label}: ${formatted.definition}` : formatted.label;
    return (
      <AnnotatableTextBlock
        key={`${activeSection.topic_title}-term-${index}`}
        as="li"
        blockId={blockId}
        text={text}
        annotations={blockAnnotations}
        pendingSelection={pendingSelectionForBlock(blockId)}
        pulse={pulse}
        termLabelEnd={formatted.label.length}
        onSelection={handleTextSelection}
        onNoteClick={handleNoteMarkerClick}
      />
    );
  }

  function openNotesFromPendingSelection() {
    if (!pendingSelection) return;
    setSelectionState(pendingSelection);
    setNoteContextText(pendingSelection.selectedText);
    setDrawerOpen(true);
    setActiveBubbleTab("notes");
  }

  function openAIFromPendingSelection(mode: AIToolMode) {
    if (!pendingSelection) return;
    setSelectionState(pendingSelection);
    setAiContextText(pendingSelection.selectedText);
    setAiContext(buildAIContextFromSelection(pendingSelection));
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
    setDrawerOpen((current) => {
      const next = !current;
      if (next) {
        setSelectionState(null);
        setPendingSelection(null);
        setNoteContextText("");
        setAiContextText("");
        setAiContext({ source: "selection", selectedText: "" });
        setNoteComposerValue("");
      } else {
        setSelectionState(null);
        setPendingSelection(null);
        setNoteContextText("");
        setAiContextText("");
        setAiContext({ source: "selection", selectedText: "" });
        setNoteComposerValue("");
      }
      return next;
    });
  }

  const supportContentVisible = !readingMode;

  return (
    <section style={{ width: "100%", display: "block" }}>
      <div
        ref={rootRef}
        style={{
          cursor: "text",
          width: "100%",
          maxWidth: readingMode ? "900px" : "1080px",
          marginInline: "auto",
        }}
      >
        <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
          <div
            className="study-support-surface"
            style={{
              maxWidth: "820px",
              marginInline: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "0.9rem",
                flexWrap: "wrap",
                marginBottom: "0.95rem",
              }}
            >
              <div>
                <p className="study-meta-label" style={{ marginBottom: "0.3rem" }}>
                  Study Summary
                </p>
                <p style={{ fontSize: "0.95rem", color: "var(--distill-text-secondary)", lineHeight: 1.6 }}>
                  Topic {activeIndex + 1} of {sections.length}. Read first, then use notes and AI only when needed.
                </p>
                <p className="study-body-copy" style={{ fontSize: "0.86rem", marginTop: "0.35rem" }}>
                  Select text to highlight, underline, attach a note, or ask AI.
                </p>
              </div>
              <Button
                variant={readingMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setReadingMode((current) => {
                    const next = !current;
                    if (next) {
                      setDrawerOpen(false);
                    }
                    return next;
                  });
                }}
                style={{
                  minHeight: "40px",
                  paddingInline: "16px",
                  borderRadius: "999px",
                  color: readingMode ? "var(--theme-on-primary)" : "var(--foreground)",
                }}
              >
                {readingMode ? "Exit Focused Reading" : "Focused Reading"}
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <p className="study-meta-label" style={{ minWidth: "fit-content" }}>
                Progress
              </p>
              <div
                style={{
                  flex: 1,
                  minWidth: "180px",
                  height: "8px",
                  borderRadius: "999px",
                  backgroundColor: "color-mix(in srgb, var(--theme-soft) 72%, var(--border))",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--theme-primary), var(--theme-primary-hover))",
                  }}
                />
              </div>
            </div>
          </div>

          {annotationError ? (
            <p
              style={{
                color: "#b42318",
                fontSize: "0.88rem",
                maxWidth: "820px",
                marginInline: "auto",
              }}
            >
              {annotationError}
            </p>
          ) : null}

          {supportContentVisible ? (
            <div
              className="study-support-surface"
              style={{
                maxWidth: "820px",
                marginInline: "auto",
              }}
            >
              <p className="study-meta-label" style={{ marginBottom: "0.55rem" }}>
                Overall Overview
              </p>
              <AnnotatableTextBlock
                as="p"
                blockId={overviewBlockId}
                text={summary.overall_overview}
                annotations={topicAnnotations.filter(
                  (annotation) => annotation.blockId === overviewBlockId,
                )}
                pendingSelection={pendingSelectionForBlock(overviewBlockId)}
                onSelection={handleTextSelection}
                onNoteClick={handleNoteMarkerClick}
                style={{
                  fontSize: "1.02rem",
                  lineHeight: 1.82,
                  color: "var(--distill-text-secondary)",
                }}
              />
            </div>
          ) : null}
        </div>

        <article
          className="study-reading-surface"
          style={{
            background: readingMode
              ? "linear-gradient(180deg, color-mix(in srgb, var(--card) 99%, white), var(--card))"
              : undefined,
          }}
        >
          <p className="study-meta-label" style={{ marginBottom: "0.7rem" }}>
            Detailed Topic
          </p>
          <AnnotatableTextBlock
            as="h2"
            blockId={titleBlockId}
            text={activeSection.topic_title}
            annotations={topicAnnotations.filter(
              (annotation) => annotation.blockId === titleBlockId,
            )}
            pendingSelection={pendingSelectionForBlock(titleBlockId)}
            onSelection={handleTextSelection}
            onNoteClick={handleNoteMarkerClick}
            style={{
              fontSize: "clamp(1.9rem, 4vw, 2.7rem)",
              lineHeight: 1.16,
              fontWeight: 700,
              color: "var(--foreground)",
              marginBottom: "1.45rem",
            }}
          />

          <div style={{ display: "grid", gap: "1.75rem" }}>
            <div>
              <p className="study-meta-label" style={{ marginBottom: "0.85rem" }}>
                Key Points
              </p>
              <AnimatePresence mode="wait">
                <motion.ul
                  key={`topic-points-${activeIndex}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="study-reading-copy"
                  style={{
                    display: "grid",
                    gap: "0.95rem",
                    paddingLeft: "1.2rem",
                  }}
                >
                  {activeSection.key_points.map(renderPoint)}
                </motion.ul>
              </AnimatePresence>
            </div>

            {activeSection.important_terms_and_definitions.length > 0 ? (
              <div
                className="study-support-surface"
                style={{
                  padding: "1.1rem 1.2rem",
                }}
              >
                <p className="study-meta-label" style={{ marginBottom: "0.85rem" }}>
                  Important Terms and Definitions
                </p>
                <AnimatePresence mode="wait">
                  <motion.ul
                    key={`topic-terms-${activeIndex}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="study-reading-copy"
                    style={{
                      display: "grid",
                      gap: "0.8rem",
                      paddingLeft: 0,
                      listStyle: "none",
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
            maxWidth: "820px",
            margin: "1rem auto 0",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flex: 1, justifyContent: "flex-start" }}>
            <Button
              variant="outline"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((current) => current - 1)}
              style={{ minHeight: "42px", minWidth: "148px", paddingInline: "18px", borderRadius: "999px" }}
            >
              Previous Topic
            </Button>
          </div>
          <div style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}>
            <Button
              disabled={activeIndex === sections.length - 1}
              onClick={() => setActiveIndex((current) => current + 1)}
              style={{
                minHeight: "42px",
                minWidth: "128px",
                paddingInline: "18px",
                borderRadius: "999px",
                color: "var(--theme-on-primary)",
              }}
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

        {supportContentVisible ? (
          <RelatedLearningVideos documentId={documentId} />
        ) : null}

        <AnimatePresence>
          {pendingSelection ? (
            <motion.div
              ref={selectionPopoverRef}
              data-highlight-popover="true"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
              className="study-selection-popover"
              style={{
                position: "fixed",
                top: pendingSelection.y,
                left:
                  typeof window !== "undefined"
                    ? Math.min(Math.max(pendingSelection.x, 220), window.innerWidth - 220)
                    : pendingSelection.x,
                transform: "translateX(-50%)",
                zIndex: 110,
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
                  aria-label={`Highlight selection in ${color}`}
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
                  aria-keyshortcuts="Alt+U"
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
                        onClick={() => saveUnderline(color)}
                        aria-label={`Underline selection in ${color}`}
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
                aria-label="Add selected text to a note"
                style={{ minHeight: "36px", paddingInline: "14px", borderRadius: "12px" }}
              >
                Add to Note
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openAIFromPendingSelection("ask-ai")}
                aria-label="Ask AI about the selected text"
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
        documentId={documentId}
        activeTab={activeBubbleTab}
        onTabChange={setActiveBubbleTab}
        selectedText={aiContextText || selectionState?.selectedText || pendingSelection?.selectedText || ""}
        aiContext={
          aiContext.selectedText || aiContext.noteContent
            ? aiContext
            : {
                source: "selection",
                selectedText: aiContextText || selectionState?.selectedText || pendingSelection?.selectedText || "",
              }
        }
        assistantInitialQuestion={assistantInitialQuestion}
        aiMode={aiMode}
        notes={topicNotes}
        deletedNotes={deletedNotes}
        focusedNoteId={focusedNoteId}
        noteComposerValue={noteComposerValue}
        noteComposerTextareaId={noteComposerTextareaId}
        selectedNoteText={noteContextText || selectionState?.selectedText || pendingSelection?.selectedText || ""}
        onNoteComposerChange={setNoteComposerValue}
        onSaveNote={saveNote}
        onDeleteNote={deleteNote}
        onRestoreNote={restoreDeletedNote}
        onForceDeleteNote={permanentlyDeleteNote}
        onJumpToText={jumpToText}
        onAskAINote={(note) => {
          setDrawerOpen(true);
          setActiveBubbleTab("ai");
          setAiMode("ask-ai");
          setAssistantInitialQuestion("");
          setAiContextText(note.selectedText ?? "General note");
          setAiContext({
            source: "note",
            selectedText: note.selectedText ?? "",
            noteContent: note.content,
          });
          setSelectionState(
            note.annotationId && note.selectedText
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
