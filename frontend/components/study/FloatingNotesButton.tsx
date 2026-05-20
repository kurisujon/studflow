"use client";

import { MessageSquareText } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FloatingNotesButton({
  count,
  onClick,
  behindDrawer = false,
}: {
  count: number;
  onClick: () => void;
  behindDrawer?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      data-study-bubble-head="true"
      style={{
        position: "fixed",
        right: "20px",
        top: "128px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "52px",
        height: "52px",
        borderRadius: "18px",
        boxShadow: "0 16px 38px rgba(17,17,16,0.14)",
        zIndex: behindDrawer ? 60 : 79,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,247,237,0.96))",
        border: "1px solid rgba(249,115,22,0.14)",
      }}
      aria-label="Open study tools"
      title="Open study tools"
    >
      <MessageSquareText size={18} />
      <span
        style={{
          position: "absolute",
          top: "-4px",
          right: "-4px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "1.25rem",
          height: "1.25rem",
          borderRadius: "999px",
          backgroundColor: "#111110",
          color: "#ffffff",
          fontSize: "0.72rem",
          fontWeight: 600,
          border: "1px solid rgba(255,255,255,0.22)",
        }}
      >
        {count}
      </span>
    </Button>
  );
}
