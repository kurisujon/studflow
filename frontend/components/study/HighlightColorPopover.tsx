"use client";

import type { AnnotationColor } from "@/types/annotations";

const COLORS: Array<{ color: AnnotationColor; label: string; swatch: string }> = [
  { color: "yellow", label: "Important", swatch: "#facc15" },
  { color: "blue", label: "Concept", swatch: "#60a5fa" },
  { color: "green", label: "Remembered", swatch: "#34d399" },
  { color: "red", label: "Confusing", swatch: "#fb7185" },
  { color: "purple", label: "Exam-related", swatch: "#c084fc" },
];

export function HighlightColorPopover({
  activeColor,
  onSelect,
}: {
  activeColor: AnnotationColor | null;
  onSelect: (color: AnnotationColor) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 0.45rem)",
        left: 0,
        padding: "0.5rem",
        borderRadius: "16px",
        backgroundColor: "rgba(28, 25, 23, 0.96)",
        boxShadow: "0 14px 32px rgba(17,17,16,0.24)",
        display: "flex",
        gap: "0.45rem",
      }}
    >
      {COLORS.map((item) => (
        <button
          key={item.color}
          type="button"
          title={item.label}
          onClick={() => onSelect(item.color)}
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "999px",
            border:
              activeColor === item.color
                ? "2px solid rgba(255,255,255,0.95)"
                : "1px solid rgba(255,255,255,0.45)",
            backgroundColor: item.swatch,
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  );
}
