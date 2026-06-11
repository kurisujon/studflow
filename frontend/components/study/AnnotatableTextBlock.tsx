"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { StickyNote } from "lucide-react";

import type {
  StudyAnnotation,
  TextSelectionPayload,
} from "@/types/annotations";

type AnnotatableElement = "span" | "p" | "h2" | "li";

const HIGHLIGHT_COLOR_MAP = {
  blue: "rgba(96,165,250,0.24)",
  yellow: "rgba(250,204,21,0.28)",
  green: "rgba(52,211,153,0.24)",
  pink: "rgba(251,113,133,0.22)",
  purple: "rgba(192,132,252,0.2)",
} satisfies Record<NonNullable<StudyAnnotation["color"]>, string>;

const UNDERLINE_COLOR_MAP = {
  blue: "#60a5fa",
  yellow: "#facc15",
  green: "#34d399",
  pink: "#fb7185",
  purple: "#a78bfa",
  neutral: "#525252",
} satisfies Record<NonNullable<StudyAnnotation["underlineColor"]>, string>;

export interface AnnotatableTextBlockProps {
  blockId: string;
  text: string;
  annotations: StudyAnnotation[];
  onSelection: (payload: TextSelectionPayload) => void;
  onNoteClick?: (annotationId: string) => void;
  className?: string;
  as?: AnnotatableElement;
  style?: CSSProperties;
  pendingSelection?: { startOffset: number; endOffset: number } | null;
  pulse?: boolean;
  termLabelEnd?: number;
}

function normalizeSelectionText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getTextOffset(root: HTMLElement, node: Node, offset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(candidate) {
      const parent = candidate.parentElement;
      if (parent?.closest("[data-annotation-marker]")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });
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

  return -1;
}

function renderTextWithOptionalTermLabel(
  text: string,
  startOffset: number,
  termLabelEnd?: number,
) {
  if (!termLabelEnd || startOffset >= termLabelEnd) {
    return text;
  }

  const endOffset = startOffset + text.length;
  if (endOffset <= 0) {
    return text;
  }

  const labelStart = Math.max(0, -startOffset);
  const labelEnd = Math.min(text.length, termLabelEnd - startOffset);
  const before = text.slice(0, labelStart);
  const label = text.slice(labelStart, labelEnd);
  const after = text.slice(labelEnd);

  return (
    <>
      {before}
      <strong style={{ color: "var(--theme-primary)" }}>{label}</strong>
      {after}
    </>
  );
}

function renderAnnotatedNodes({
  text,
  blockId,
  annotations,
  pendingSelection,
  termLabelEnd,
  onNoteClick,
}: {
  text: string;
  blockId: string;
  annotations: StudyAnnotation[];
  pendingSelection?: { startOffset: number; endOffset: number } | null;
  termLabelEnd?: number;
  onNoteClick?: (annotationId: string) => void;
}) {
  const blockAnnotations = annotations
    .filter(
      (annotation) =>
        annotation.blockId === blockId &&
        annotation.startOffset >= 0 &&
        annotation.endOffset <= text.length &&
        annotation.startOffset < annotation.endOffset,
    )
    .sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset);
  const breakpoints = new Set([0, text.length]);

  for (const annotation of blockAnnotations) {
    breakpoints.add(annotation.startOffset);
    breakpoints.add(annotation.endOffset);
  }

  if (
    pendingSelection &&
    pendingSelection.startOffset >= 0 &&
    pendingSelection.endOffset <= text.length &&
    pendingSelection.startOffset < pendingSelection.endOffset
  ) {
    breakpoints.add(pendingSelection.startOffset);
    breakpoints.add(pendingSelection.endOffset);
  }

  if (termLabelEnd && termLabelEnd > 0 && termLabelEnd < text.length) {
    breakpoints.add(termLabelEnd);
  }

  const orderedBreakpoints = [...breakpoints].sort((a, b) => a - b);
  const nodes: ReactNode[] = [];

  for (let index = 0; index < orderedBreakpoints.length - 1; index += 1) {
    const start = orderedBreakpoints[index];
    const end = orderedBreakpoints[index + 1];
    if (start === end) continue;

    const slice = text.slice(start, end);
    const segmentAnnotations = blockAnnotations.filter(
      (annotation) => annotation.startOffset <= start && annotation.endOffset >= end,
    );
    const highlight = segmentAnnotations.find((annotation) => annotation.type === "highlight");
    const underline = segmentAnnotations.find((annotation) => annotation.type === "underline");
    const note = segmentAnnotations.find((annotation) => annotation.type === "note");
    const isPending =
      pendingSelection !== null &&
      pendingSelection !== undefined &&
      pendingSelection.startOffset <= start &&
      pendingSelection.endOffset >= end;
    const style: CSSProperties = {};

    if (isPending) {
      style.backgroundColor = "rgba(59,130,246,0.22)";
      style.borderRadius = "0.25rem";
    }

    if (highlight?.color) {
      style.backgroundColor = HIGHLIGHT_COLOR_MAP[highlight.color];
      style.borderRadius = "0.3rem";
      style.padding = "0 0.08rem";
    }

    if (underline?.underlineColor) {
      style.textDecorationLine = "underline";
      style.textDecorationColor = UNDERLINE_COLOR_MAP[underline.underlineColor];
      style.textDecorationThickness = "2px";
      style.textUnderlineOffset = "3px";
    }

    if (note) {
      style.borderBottom = "1px dashed var(--theme-primary)";
      style.borderRadius = "0.2rem";
      style.cursor = "pointer";
    }

    const content = renderTextWithOptionalTermLabel(slice, start, termLabelEnd);
    const annotationId = note?.id ?? highlight?.id ?? underline?.id;
    const annotationType = note?.type ?? highlight?.type ?? underline?.type;
    const shouldRenderSpan = isPending || segmentAnnotations.length > 0 || Object.keys(style).length > 0;

    if (!shouldRenderSpan) {
      nodes.push(<span key={`${start}-${end}`}>{content}</span>);
      continue;
    }

    nodes.push(
      <span
        key={`${start}-${end}`}
        data-annotation-id={annotationId}
        data-annotation-type={annotationType}
        className={note ? "study-annotation-note" : undefined}
        tabIndex={note ? 0 : undefined}
        role={note ? "button" : undefined}
        aria-label={note ? "Open note for this selection" : undefined}
        onClick={
          note
            ? (event) => {
                event.stopPropagation();
                onNoteClick?.(note.id);
              }
            : undefined
        }
        onKeyDown={
          note
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onNoteClick?.(note.id);
                }
              }
            : undefined
        }
        style={style}
      >
        {content}
        {note && end === note.endOffset ? (
          <span
            data-annotation-marker="true"
            data-note-id={note.id}
            style={{
              display: "inline-flex",
              marginLeft: "0.22rem",
              verticalAlign: "-0.1rem",
              color: "var(--theme-primary)",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={(event) => {
              event.stopPropagation();
              onNoteClick?.(note.id);
            }}
          >
            <StickyNote className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </span>,
    );
  }

  return nodes;
}

export function AnnotatableTextBlock({
  blockId,
  text,
  annotations,
  onSelection,
  onNoteClick,
  className,
  as = "span",
  style,
  pendingSelection,
  pulse,
  termLabelEnd,
}: AnnotatableTextBlockProps) {
  const blockRef = useRef<HTMLElement | null>(null);

  function captureSelection() {
    const blockRoot = blockRef.current;
    const selection = window.getSelection();
    if (!blockRoot || !selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }

    if (
      !blockRoot.contains(selection.anchorNode) ||
      !blockRoot.contains(selection.focusNode)
    ) {
      return;
    }

    const browserSelectedText = selection.toString().trim();
    if (!browserSelectedText) return;

    const range = selection.getRangeAt(0);
    const rawStartOffset = getTextOffset(blockRoot, range.startContainer, range.startOffset);
    const rawEndOffset = getTextOffset(blockRoot, range.endContainer, range.endOffset);
    if (rawStartOffset < 0 || rawEndOffset < 0) return;

    let startOffset = Math.min(rawStartOffset, rawEndOffset);
    let endOffset = Math.max(rawStartOffset, rawEndOffset);

    const rawSelectedText = text.slice(startOffset, endOffset);
    const leadingWhitespace = rawSelectedText.match(/^\s*/)?.[0].length ?? 0;
    const trailingWhitespace = rawSelectedText.match(/\s*$/)?.[0].length ?? 0;
    startOffset += leadingWhitespace;
    endOffset -= trailingWhitespace;

    if (startOffset >= endOffset) return;

    const selectedTextFromOffsets = text.slice(startOffset, endOffset).trim();
    if (
      !selectedTextFromOffsets ||
      normalizeSelectionText(browserSelectedText) !==
        normalizeSelectionText(selectedTextFromOffsets)
    ) {
      console.warn("Annotation selection offset mismatch", {
        blockId,
        selectedTextFromBrowser: browserSelectedText,
        selectedTextFromOffsets,
        normalizedStart: startOffset,
        normalizedEnd: endOffset,
      });
      return;
    }

    onSelection({
      blockId,
      selectedText: browserSelectedText,
      startOffset,
      endOffset,
      rect: range.getBoundingClientRect(),
    });
  }

  const Component = as;
  return (
    <Component
      ref={(element: HTMLElement | null) => {
        blockRef.current = element;
      }}
      data-annotatable-block={blockId}
      data-annotatable-root="true"
      className={className}
      onPointerUpCapture={() => window.setTimeout(captureSelection, 0)}
      onMouseUpCapture={() => window.setTimeout(captureSelection, 0)}
      style={{
        ...style,
        userSelect: "text",
        animation: pulse ? "notePulse 1s ease-out" : undefined,
      }}
    >
      {renderAnnotatedNodes({
        text,
        blockId,
        annotations,
        pendingSelection,
        termLabelEnd,
        onNoteClick,
      })}
    </Component>
  );
}
