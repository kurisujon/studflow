"use client";

import { motion } from "framer-motion";
import {
  FileTextIcon,
  LayersIcon,
  CircleHelpIcon,
  BotIcon,
  StickyNoteIcon,
  FolderOpenIcon,
} from "@/components/home/icon-registry";

const GALLERY_ITEMS = [
  { id: 1, title: "Document Summary View", icon: FileTextIcon, description: "Get the main ideas instantly before deep reading." },
  { id: 2, title: "Interactive Flashcards", icon: LayersIcon, description: "Active recall embedded right into your study flow." },
  { id: 3, title: "Quiz History", icon: CircleHelpIcon, description: "Track your attempts and easily retry missed questions." },
  { id: 4, title: "AI Chat Interface", icon: BotIcon, description: "Ask questions and get grounded answers from your document." },
  { id: 5, title: "Saved Notes & Highlights", icon: StickyNoteIcon, description: "Annotate and quickly return to contextual highlights." },
  { id: 6, title: "Dashboard Overview", icon: FolderOpenIcon, description: "Manage your documents and review sessions effectively." },
];

export function SystemGallery() {
  return (
    <div style={{ overflow: "hidden", position: "relative", width: "100%", padding: "1rem 0 3rem" }}>
      {/* Fading edges to blend with background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "15vw",
          background: "linear-gradient(to right, var(--background), transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "15vw",
          background: "linear-gradient(to left, var(--background), transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 40,
        }}
        style={{ display: "flex", gap: "2rem", width: "max-content", padding: "0 1rem" }}
      >
        {/* Double the array for infinite scroll effect */}
        {[...GALLERY_ITEMS, ...GALLERY_ITEMS].map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            style={{
              width: "600px",
              height: "360px",
              borderRadius: "28px",
              border: "1px dashed color-mix(in srgb, var(--theme-border) 80%, var(--border))",
              background: "color-mix(in srgb, var(--card) 60%, var(--background))",
              boxShadow: "0 20px 40px color-mix(in srgb, var(--theme-shadow) 20%, transparent)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* The Image Placeholder Badge */}
            <div
              style={{
                position: "absolute",
                top: "1.5rem",
                left: "1.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "12px",
                backgroundColor: "color-mix(in srgb, var(--theme-soft) 80%, var(--card))",
                border: "1px solid color-mix(in srgb, var(--theme-border) 60%, var(--border))",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--theme-primary)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                zIndex: 1,
              }}
            >
              <item.icon size={16} />
              [Image #{item.id}]
            </div>

            {/* Inner skeleton/graphic */}
            <div 
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.25rem",
                opacity: 0.8,
                zIndex: 1,
              }}
            >
               <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "24px",
                  background: "color-mix(in srgb, var(--theme-soft) 50%, var(--card))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.5rem",
                  boxShadow: "0 8px 16px color-mix(in srgb, var(--theme-shadow) 20%, transparent)"
               }}>
                 <item.icon size={40} style={{ color: "var(--theme-primary)", opacity: 0.8 }} />
               </div>
               
              <h4 style={{ fontSize: "1.35rem", color: "var(--distill-text-primary)", fontWeight: 600 }}>
                {item.title}
              </h4>
              <p style={{ fontSize: "1rem", color: "var(--distill-text-secondary)", maxWidth: "400px", textAlign: "center", lineHeight: 1.5 }}>
                {item.description}
              </p>
            </div>
            
            {/* Subtle decorative background gradient */}
            <div style={{
              position: "absolute",
              bottom: "-20%",
              right: "-10%",
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 10%, transparent) 0%, transparent 70%)",
              zIndex: 0,
              pointerEvents: "none"
            }} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
