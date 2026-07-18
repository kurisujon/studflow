"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { ArrowRight, Sparkles, FileText, CheckCircle, Layers, BookOpen, Zap, Brain } from "lucide-react";

// ── Workflow steps for the animated product preview ──────────────────────────
const workflowSteps = [
  { icon: FileText,  label: "Uploading document…",     color: "text-[#168BFF]", bg: "bg-[#F0F7FF]" },
  { icon: Brain,     label: "AI reading content…",      color: "text-[#7C3AED]", bg: "bg-[#F5F3FF]" },
  { icon: Zap,       label: "Generating summary…",      color: "text-[#4F46E5]", bg: "bg-[#EEEDFC]" },
  { icon: Layers,    label: "Creating flashcards…",     color: "text-[#168BFF]", bg: "bg-[#F0F7FF]" },
  { icon: CheckCircle, label: "Ready to study! 🎉",    color: "text-emerald-500", bg: "bg-emerald-50" },
];

// ── Floating stat cards ────────────────────────────────────────────────────
const floatingCards = [
  {
    id: "flashcards",
    icon: Layers,
    title: "Flashcards",
    value: "24 cards",
    sub: "Generated instantly",
    color: "text-[#4F46E5]",
    bg: "bg-[#EEEDFC]",
    position: "top-4 -right-4 lg:-right-12",
    delay: 0,
  },
  {
    id: "summary",
    icon: BookOpen,
    title: "Summary",
    value: "3 min read",
    sub: "Key concepts extracted",
    color: "text-[#168BFF]",
    bg: "bg-[#F0F7FF]",
    position: "-bottom-4 -left-4 lg:-left-10",
    delay: 1.2,
  },
];

// ── Trust indicators ────────────────────────────────────────────────────────
const trustItems = [
  { emoji: "⭐", text: "Trusted by 10k+ students" },
  { emoji: "📄", text: "Supports PDF & DOCX" },
  { emoji: "⚡", text: "AI results in seconds" },
];

// ── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ── Animated Product Preview ────────────────────────────────────────────────
function ProductPreview() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset and animate progress bar for the new step
    const startTime = Date.now();
    const duration = 1500; // ms per step

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const next = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(next);
      if (next >= 100) clearInterval(progressInterval);
    }, 24);

    const stepTimer = setTimeout(() => {
      setStepIndex((i) => (i + 1) % workflowSteps.length);
    }, duration + 100);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimer);
    };
  }, [stepIndex]);

  const currentStep = workflowSteps[stepIndex];
  const StepIcon = currentStep.icon;
  const completedCount = stepIndex;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/40 shadow-2xl"
      style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)" }}
    >
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#168BFF] via-[#4F46E5] to-[#7C3AED]" />

      <div className="p-6 pt-8">
        {/* File name header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#168BFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0F172A] truncate">Neuroscience Chapter 4.pdf</p>
            <p className="text-xs text-[#64748B]">2.4 MB · PDF Document</p>
          </div>
          <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-[#F0F7FF] text-[#168BFF]">
            Live
          </span>
        </div>

        {/* Current step indicator */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl ${currentStep.bg} flex items-center justify-center shrink-0`}>
              <StepIcon className={`w-5 h-5 ${currentStep.color}`} />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIndex}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-semibold text-[#0F172A]"
              >
                {currentStep.label}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#168BFF] to-[#4F46E5]"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </div>

        {/* Step checklist */}
        <div className="space-y-2.5">
          {workflowSteps.slice(0, -1).map((step, i) => {
            const Icon = step.icon;
            const isDone = i < completedCount;
            const isCurrent = i === stepIndex;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                  isDone ? "opacity-100" : isCurrent ? "opacity-100" : "opacity-35"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  isDone ? "bg-emerald-100" : isCurrent ? step.bg : "bg-[#F1F5F9]"
                }`}>
                  {isDone ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Icon className={`w-3 h-3 ${isCurrent ? step.color : "text-[#94A3B8]"}`} />
                  )}
                </div>
                <span className={`font-medium ${isDone ? "text-emerald-600 line-through decoration-emerald-400" : isCurrent ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                  {step.label.replace("…", "").replace("! 🎉", "")}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Grade badge */}
        <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#94A3B8] font-medium">Exam confidence</p>
            <p className="text-sm font-bold text-[#0F172A]">High · 94% retention</p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#168BFF] to-[#4F46E5] flex items-center justify-center shadow-lg shadow-[#168BFF]/30"
          >
            <span className="text-lg font-black text-white">A+</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section className="landing-section landing-hero relative w-full overflow-hidden bg-[#F8FAFC]">
      {/* ── Background glows and patterns ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Subtle CSS Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: `linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)',
            maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
          }}
        />
        <div className="absolute -top-1/3 -right-1/4 w-[900px] h-[900px] rounded-full bg-gradient-to-b from-[#168BFF]/12 to-[#7C3AED]/6 blur-[130px] opacity-80" />
        <div className="absolute -bottom-1/3 -left-1/3 w-[800px] h-[800px] rounded-full bg-gradient-to-t from-[#4F46E5]/10 to-transparent blur-[110px] opacity-70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#7C3AED]/6 to-transparent blur-[90px] opacity-50" />
      </div>

      <div className="landing-container relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 xl:gap-20">

          {/* ── Left: Text Content (45%) ─────────────────────────────── */}
          <motion.div
            className="flex-none w-full lg:w-[45%] flex flex-col items-center lg:items-start text-center lg:text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-sm mb-8"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#168BFF]" />
              <span className="text-xs font-semibold text-[#0F172A] tracking-wide uppercase">AI Study Platform for Students</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-extrabold tracking-tight text-[#0F172A] leading-[1.08] mb-6 max-w-[650px]"
              style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)" }}
            >
              Turn Every Lecture Into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#168BFF] via-[#4F46E5] to-[#7C3AED]">
                Your Best Grade.
              </span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              variants={itemVariants}
              className="mb-8 text-[#475569] leading-relaxed max-w-[520px]"
              style={{ fontSize: "clamp(1rem, 1.8vw, 1.125rem)" }}
            >
              Upload your lecture notes, slides, or PDFs and let StudFlow instantly transform them into concise summaries, interactive flashcards, and personalized quizzes — helping you study faster, retain more, and feel confident before every exam.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-8">
              <Link
                href="/dashboard/upload"
                className="landing-cta-primary group w-full sm:w-auto h-12 px-7 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#168BFF] to-[#4F46E5] hover:shadow-xl hover:shadow-[#168BFF]/30 transition-all duration-300 ease-out hover:-translate-y-0.5 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[#168BFF] focus-visible:outline-offset-2"
                aria-label="Start studying for free"
              >
                Start Studying Free
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="landing-cta-ghost w-full sm:w-auto h-12 px-7 rounded-xl text-sm font-semibold bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#168BFF] focus-visible:outline-offset-2"
              >
                See how it works
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2"
            >
              {trustItems.map((item) => (
                <span key={item.text} className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
                  <span>{item.emoji}</span>
                  {item.text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: Interactive Product Preview (55%) ─────────────── */}
          <motion.div
            className="flex-none w-full lg:w-[55%] relative"
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#168BFF]/8 via-[#4F46E5]/6 to-[#7C3AED]/8 blur-xl pointer-events-none" aria-hidden="true" />

            {/* Main glass card */}
            <ProductPreview />

            {/* ── Floating stat cards ── */}
            {floatingCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.id}
                  className={`absolute ${card.position} z-20 hidden sm:flex`}
                  animate={{ y: [0, card.delay === 0 ? -10 : 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 + card.delay, ease: "easeInOut", delay: card.delay }}
                >
                  <div
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-white/60 shadow-xl"
                    style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}
                  >
                    <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] leading-tight">{card.value}</p>
                      <p className="text-[10px] text-[#64748B] leading-tight">{card.sub}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
