"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  FileTextIcon,
  LayersIcon,
  CircleHelpIcon,
  BotIcon,
  StickyNoteIcon,
  FolderOpenIcon,
} from "@/components/home/icon-registry";

const SYSTEM_FEATURES = [
  {
    id: 1,
    title: "AI-Powered Summary",
    description: "Get the main ideas instantly before deep reading. The AI distills complex documents into easy-to-read summaries, saving you hours of reading time and giving you a clear overview of the material.",
    icon: FileTextIcon,
    image: "/feature-summary.jpg",
  },
  {
    id: 2,
    title: "Interactive Flashcards & Quizzes",
    description: "Active recall embedded right into your study flow. Automatically generate flashcards and quizzes from your notes to test your knowledge, track your attempts, and easily retry missed questions.",
    icon: LayersIcon,
    image: "/feature-flashcards.jpg",
  },
  {
    id: 3,
    title: "Contextual AI Chat",
    description: "Ask questions and get grounded answers directly from your document. The AI acts as your personal tutor, explaining concepts clearly and helping you understand difficult topics without leaving the page.",
    icon: BotIcon,
    image: "/feature-chat.jpg",
  },
  {
    id: 4,
    title: "Dashboard & Review Workflow",
    description: "Manage your documents, saved notes, and review sessions effectively. Track your progress, organize your materials, and never lose context of what you need to study next.",
    icon: FolderOpenIcon,
    image: "/feature-dashboard.jpg",
  }
];

export function SystemGallery() {
  return (
    <div style={{ width: "100%", padding: "2rem 0 4rem", display: "flex", flexDirection: "column", gap: "6rem" }}>
      {SYSTEM_FEATURES.map((feature, index) => {
        const isEven = index % 2 !== 0; // 0 is false, 1 is true (row-reverse)
        
        return (
          <div 
            key={feature.id} 
            style={{ 
              display: "flex", 
              flexDirection: isEven ? "row-reverse" : "row", 
              alignItems: "center", 
              gap: "4rem",
              flexWrap: "wrap"
            }}
          >
            {/* Text Content Container */}
            <div style={{ flex: "1 1 400px" }}>
              <div style={{
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "16px",
                backgroundColor: "color-mix(in srgb, var(--theme-soft) 80%, var(--card))",
                border: "1px solid color-mix(in srgb, var(--theme-border) 60%, var(--border))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.5rem",
                color: "var(--theme-primary)"
              }}>
                <feature.icon size={24} strokeWidth={2} />
              </div>
              
              <h3 style={{ 
                fontSize: "2rem", 
                fontWeight: 700, 
                color: "var(--distill-text-primary)", 
                marginBottom: "1rem",
                lineHeight: 1.2
              }}>
                {feature.title}
              </h3>
              
              <p style={{ 
                fontSize: "1.125rem", 
                color: "var(--distill-text-secondary)", 
                lineHeight: 1.6,
                maxWidth: "90%"
              }}>
                {feature.description}
              </p>
            </div>

            {/* Image Placeholder Container */}
            <div style={{ flex: "1 1 500px", position: "relative" }}>
               {/* Background Glow */}
               <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "80%",
                  height: "80%",
                  background: "radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 15%, transparent) 0%, transparent 60%)",
                  zIndex: 0,
                  pointerEvents: "none"
                }} />

              <div
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  borderRadius: "24px",
                  border: "1px solid color-mix(in srgb, var(--theme-border) 40%, var(--border))",
                  backgroundColor: "var(--card)",
                  boxShadow: "0 20px 40px color-mix(in srgb, var(--theme-shadow) 20%, transparent)",
                  position: "relative",
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                <Image 
                  src={feature.image} 
                  alt={feature.title} 
                  fill 
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
