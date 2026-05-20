"use client";

import { Eraser, Highlighter, Redo2, Underline, Undo2 } from "lucide-react";
import { motion } from "framer-motion";

import type { ActiveStudyTool } from "@/types/annotations";

export function FloatingStudyToolkit({
  visible,
  activeTool,
  onToggleHighlight,
  onUnderline,
  onEraser,
  onClearFormatting,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  visible: boolean;
  activeTool: ActiveStudyTool;
  onToggleHighlight: () => void;
  onUnderline: () => void;
  onEraser: () => void;
  onClearFormatting: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  if (!visible) {
    return null;
  }

  const iconButtonStyle = (active = false, disabled = false) => ({
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: active ? "rgba(255,255,255,0.14)" : "transparent",
    color: disabled ? "rgba(248,250,252,0.32)" : "#f8fafc",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "default" : "pointer",
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        position: "fixed",
        left: "50%",
        bottom: "28px",
        transform: "translateX(-50%)",
        zIndex: 80,
        padding: "0.55rem 0.65rem",
        borderRadius: "18px",
        backgroundColor: "rgba(28,25,23,0.96)",
        boxShadow: "0 18px 42px rgba(17,17,16,0.28)",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        backdropFilter: "blur(10px)",
        width: "max-content",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <button type="button" onClick={onToggleHighlight} title="Highlight (Alt+H)" style={iconButtonStyle(activeTool === "highlight")}>
        <Highlighter size={16} />
      </button>

      <button type="button" onClick={onUnderline} title="Underline (Alt+U)" style={iconButtonStyle(activeTool === "underline")}>
        <Underline size={16} />
      </button>

      <button type="button" onClick={onEraser} title="Eraser (Alt+E)" style={iconButtonStyle(activeTool === "erase")}>
        <Eraser size={16} />
      </button>

      <div style={{ width: "1px", height: "24px", backgroundColor: "rgba(255,255,255,0.12)", marginInline: "0.15rem" }} />

      <button type="button" onClick={onUndo} title="Undo" disabled={!canUndo} style={iconButtonStyle(false, !canUndo)}>
        <Undo2 size={16} />
      </button>
      <button type="button" onClick={onRedo} title="Redo" disabled={!canRedo} style={iconButtonStyle(false, !canRedo)}>
        <Redo2 size={16} />
      </button>
    </motion.div>
  );
}
