"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AnimatedWorkflowLine() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <div
        aria-hidden="true"
        className="hidden lg:block"
        style={{
          position: "absolute",
          top: "5.1rem",
          left: "12%",
          right: "12%",
          height: "2px",
          background:
            "linear-gradient(90deg, transparent, color-mix(in srgb, var(--theme-border) 88%, var(--theme-primary)), transparent)",
          opacity: 0.38,
        }}
      />
      <div
        aria-hidden="true"
        className="hidden lg:block"
        style={{
          position: "absolute",
          top: "4.72rem",
          left: "12%",
          right: "12%",
          height: "0.75rem",
          pointerEvents: "none",
        }}
      >
        <motion.div
          animate={reduceMotion ? undefined : { x: ["0%", "100%"] }}
          transition={{
            duration: reduceMotion ? 0 : 6.8,
            ease: "easeInOut",
            repeat: reduceMotion ? 0 : Infinity,
            repeatDelay: reduceMotion ? 0 : 0.8,
          }}
          style={{
            width: "0.8rem",
            height: "0.8rem",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #6ea8b5, #7b8ccf)",
            boxShadow: "0 0 0 6px rgba(110, 168, 181, 0.14)",
          }}
        />
      </div>
    </>
  );
}
