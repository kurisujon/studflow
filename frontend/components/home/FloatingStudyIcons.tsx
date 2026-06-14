"use client";

import { motion, useReducedMotion } from "framer-motion";

import {
  BotIcon,
  CircleHelpIcon,
  FileIcon,
  FileTextIcon,
  LayersIcon,
  PlayCircleIcon,
  SparklesIcon,
  StickyNoteIcon,
} from "@/components/home/icon-registry";

const floatingIcons = [
  { id: "pdf", Icon: FileTextIcon, top: "6%", left: "52%", delay: 0 },
  { id: "docx", Icon: FileIcon, top: "22%", left: "94%", delay: 0.12 },
  { id: "summary", Icon: FileTextIcon, top: "70%", left: "49%", delay: 0.2 },
  { id: "flashcards", Icon: LayersIcon, top: "10%", left: "86%", delay: 0.35 },
  { id: "quiz", Icon: CircleHelpIcon, top: "60%", left: "92%", delay: 0.48 },
  { id: "notes", Icon: StickyNoteIcon, top: "54%", left: "57%", delay: 0.58 },
  { id: "ask-ai", Icon: SparklesIcon, top: "35%", left: "47%", delay: 0.72 },
  { id: "video", Icon: PlayCircleIcon, top: "80%", left: "84%", delay: 0.84 },
  { id: "assistant", Icon: BotIcon, top: "28%", left: "80%", delay: 0.94 },
] as const;

export function FloatingStudyIcons() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none hidden md:block"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {floatingIcons.map(({ id, Icon, top, left, delay }) => (
        <motion.div
          key={id}
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.92 }}
          animate={
            reduceMotion
              ? { opacity: 0.24 }
              : {
                  opacity: [0.18, 0.32, 0.2],
                  y: [0, -10, 0],
                  rotate: [-2, 2, -2],
                  scale: [1, 1.03, 1],
                }
          }
          transition={{
            duration: reduceMotion ? 0 : 7.2,
            delay,
            ease: "easeInOut",
            repeat: reduceMotion ? 0 : Infinity,
          }}
          style={{
            position: "absolute",
            top,
            left,
            width: "2.75rem",
            height: "2.75rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "18px",
            border: "1px solid color-mix(in srgb, var(--theme-border) 46%, transparent)",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--card) 82%, white), color-mix(in srgb, var(--theme-soft) 72%, var(--card)))",
            color: "color-mix(in srgb, var(--theme-primary) 72%, #4d9ecf)",
            boxShadow: "0 14px 28px color-mix(in srgb, var(--theme-shadow) 28%, transparent)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Icon size={16} strokeWidth={1.8} />
        </motion.div>
      ))}

      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0 }}
        animate={
          reduceMotion
            ? { opacity: 0.08 }
            : { opacity: [0.06, 0.12, 0.06], x: [0, 16, 0], y: [0, -10, 0] }
        }
        transition={{
          duration: reduceMotion ? 0 : 9.5,
          ease: "easeInOut",
          repeat: reduceMotion ? 0 : Infinity,
        }}
        style={{
          position: "absolute",
          top: "10%",
          right: "-4%",
          width: "18rem",
          height: "18rem",
          borderRadius: "999px",
          background: "radial-gradient(circle, rgba(113, 170, 182, 0.26), transparent 70%)",
          filter: "blur(36px)",
        }}
      />
    </div>
  );
}
