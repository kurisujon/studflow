"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { ArrowRight, Sparkles, FileText, CheckCircle, Layers, BookOpen, Zap, Brain } from "lucide-react";

// ── Workflow steps for the animated product preview ──────────────────────────
const workflowSteps = [
  { icon: FileText,  label: "Uploading document",     color: "text-[#168BFF]", bg: "bg-[#F0F7FF]", activeColor: "text-[#0F172A]" },
  { icon: Brain,     label: "AI reading content",      color: "text-[#7C3AED]", bg: "bg-[#F5F3FF]", activeColor: "text-[#7C3AED]" },
  { icon: Zap,       label: "Generating summary",      color: "text-[#4F46E5]", bg: "bg-[#EEEDFC]", activeColor: "text-[#4F46E5]" },
  { icon: Layers,    label: "Creating flashcards",     color: "text-[#168BFF]", bg: "bg-[#F0F7FF]", activeColor: "text-[#168BFF]" },
  { icon: CheckCircle, label: "Ready to study!",    color: "text-emerald-500", bg: "bg-emerald-50", activeColor: "text-emerald-600" },
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
    const startTime = Date.now();
    const duration = 1800; // ms per step

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const next = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(next);
      if (next >= 100) clearInterval(progressInterval);
    }, 24);

    const stepTimer = setTimeout(() => {
      setStepIndex((i) => (i + 1) % workflowSteps.length);
    }, duration + 200);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimer);
    };
  }, [stepIndex]);

  const currentStep = workflowSteps[stepIndex];
  const StepIcon = currentStep.icon;
  const completedCount = stepIndex;

  return (
    <div className="relative w-full max-w-[560px] mx-auto rounded-[32px] border border-white/60 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.08)] bg-white/70 backdrop-blur-xl overflow-hidden flex flex-col text-left">
      
      {/* ── Floating Badges ── */}
      <motion.div 
        className="absolute top-6 right-6 z-20 flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-white/80 shadow-lg bg-white/90 backdrop-blur-md"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <div className="w-8 h-8 rounded-xl bg-[#EEEDFC] flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 text-[#4F46E5]" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#0F172A] leading-tight">24 Cards</p>
        </div>
      </motion.div>

      <motion.div 
        className="absolute bottom-8 right-8 z-20 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#168BFF] to-[#4F46E5] flex items-center justify-center shadow-xl shadow-[#168BFF]/30 border border-white/20"
        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
      >
        <span className="text-xl font-black text-white">A+</span>
      </motion.div>

      {/* ── Main Content Container ── */}
      <div className="p-6 md:p-10 lg:px-12 lg:pt-10 lg:pb-11 flex flex-col w-full h-full">
        
        {/* Document Header */}
        <div className="flex flex-col items-start w-full">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EBF5FF] to-[#F0F7FF] flex items-center justify-center shadow-inner mb-4 border border-[#168BFF]/10">
            <FileText className="w-7 h-7 text-[#168BFF]" />
          </div>
          
          <h3 className="text-xl font-bold text-[#0F172A] mb-3">Neuroscience Chapter 4.pdf</h3>
          <p className="text-sm font-medium text-[#64748B]">2.4 MB · PDF Document</p>
        </div>

        {/* Processing Status */}
        <div className="mt-8 mb-5 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${currentStep.bg} flex items-center justify-center shrink-0 shadow-sm transition-colors duration-300`}>
            <StepIcon className={`w-5 h-5 ${currentStep.color}`} />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.2 }}
              className={`text-[15px] font-bold ${currentStep.activeColor}`}
            >
              {currentStep.label}...
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-7 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#168BFF] via-[#4F46E5] to-[#7C3AED]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-3">
          {workflowSteps.slice(0, -1).map((step, i) => {
            const Icon = step.icon;
            const isDone = i < completedCount;
            const isCurrent = i === stepIndex;
            
            return (
              <motion.div
                key={i}
                className={`flex items-center gap-3 h-[34px] transition-all duration-300 ${
                  isDone ? "opacity-40" : isCurrent ? "opacity-100 scale-[1.02] origin-left" : "opacity-20"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  isDone ? "bg-emerald-100" : isCurrent ? step.bg : "bg-[#E2E8F0]"
                }`}>
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                  )}
                </div>
                <span className={`text-[15px] font-semibold ${isDone ? "text-emerald-700 line-through decoration-emerald-300" : isCurrent ? "text-[#0F172A]" : "text-[#64748B]"}`}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-full border-t border-[#E2E8F0] my-7" />

        {/* Footer Retention Score */}
        <div className="flex flex-col items-start gap-1">
          <p className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Exam confidence</p>
          <p className="text-lg font-black text-[#0F172A]">High · 94% retention</p>
        </div>

      </div>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section className="landing-section landing-hero relative w-full overflow-hidden bg-[#F8FAFC]">
      {/* ── Background glows ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-b from-[#168BFF]/10 to-[#7C3AED]/5 blur-[120px] opacity-70" />
        <div className="absolute top-[20%] left-[-15%] w-[700px] h-[700px] rounded-full bg-gradient-to-t from-[#4F46E5]/10 to-transparent blur-[100px] opacity-60" />
      </div>

      <div className="landing-container relative z-10 flex flex-col items-center">
        
        {/* ── Top: Text Content (Centered) ─────────────────────────────── */}
        <motion.div
          className="w-full flex flex-col items-center text-center max-w-4xl mx-auto mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] shadow-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#168BFF]" />
            <span className="text-xs font-bold text-[#0F172A] tracking-wider uppercase">AI Study Platform for Students</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-black tracking-tight text-[#0F172A] leading-[1.1] mb-6 max-w-[800px]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.8rem)" }}
          >
            Turn Every Lecture Into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#168BFF] via-[#4F46E5] to-[#7C3AED]">
              Your Best Grade.
            </span>
          </motion.h1>

          {/* Supporting text */}
          <motion.p
            variants={itemVariants}
            className="mb-10 text-[#475569] leading-relaxed max-w-[640px] mx-auto"
            style={{ fontSize: "clamp(1.125rem, 2vw, 1.25rem)" }}
          >
            Upload your lecture notes, slides, or PDFs and let StudFlow instantly transform them into concise summaries, interactive flashcards, and personalized quizzes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-12">
            <Link
              href="/dashboard/upload"
              className="landing-cta-primary group w-full sm:w-auto h-14 px-10 rounded-xl text-base font-bold bg-gradient-to-r from-[#168BFF] to-[#4F46E5] hover:shadow-2xl hover:shadow-[#168BFF]/40 transition-all duration-300 ease-out hover:-translate-y-1 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[#168BFF] focus-visible:outline-offset-2 whitespace-nowrap"
              aria-label="Start studying for free"
            >
              Start Studying Free
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="landing-cta-ghost w-full sm:w-auto h-14 px-10 rounded-xl text-base font-bold bg-white border-2 border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-1 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#168BFF] focus-visible:outline-offset-2 whitespace-nowrap"
            >
              See how it works
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-4"
          >
            {trustItems.map((item) => (
              <span key={item.text} className="flex items-center gap-2 text-sm text-[#475569] font-semibold">
                <span className="text-lg">{item.emoji}</span>
                {item.text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Bottom: Interactive Product Preview ───────────────────────── */}
        <motion.div
          className="w-full relative z-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <ProductPreview />
        </motion.div>

      </div>
    </section>
  );
}
