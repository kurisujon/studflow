"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { ArrowRight, Sparkles, FileText, CheckCircle, PlayCircle, Loader2, GraduationCap } from "lucide-react";
import { LandingSection } from "./ui/LandingSection";
import { LandingContainer } from "./ui/LandingContainer";
import { LandingBadge } from "./ui/LandingBadge";
import { LandingButton } from "./ui/LandingButton";
import { LandingCard } from "./ui/LandingCard";

// ── Workflow steps for the animated product preview ──────────────────────────
const workflowSteps = [
  { label: "Uploading document", percentage: 78, isLoader: true },
  { label: "AI reading content", percentage: null, isLoader: false },
  { label: "Generating summary", percentage: null, isLoader: false },
  { label: "Creating flashcards", percentage: null, isLoader: false },
];

// ── Trust indicators ────────────────────────────────────────────────────────
const trustItems = [
  { emoji: "⭐", text: "Trusted by 10K+ students" },
  { emoji: "📄", text: "Supports PDF & DOCX" },
  { emoji: "⚡", text: "AI results in seconds" },
];

// ── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ── Animated Product Preview ────────────────────────────────────────────────
function ProductPreview() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(78);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const duration = 2000;

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + 1;
      });
    }, 40);

    const stepTimer = setTimeout(() => {
      setStepIndex((i) => (i + 1) % (workflowSteps.length + 1));
      setProgress(0);
    }, duration + 500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimer);
    };
  }, [stepIndex]);

  const completedCount = stepIndex;

  return (
    <div className="relative w-full max-w-[580px] mx-auto z-10">
      {/* Background decoration behind card */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-30 pointer-events-none" />
      <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-gradient-to-br from-[#168BFF]/10 to-[#7C3AED]/20 blur-[60px] rounded-full pointer-events-none" />

      {/* Floating Badges */}
      <motion.div 
        className="absolute -top-6 right-8 z-30 w-12 h-12 rounded-xl bg-[#A78BFA] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30 border border-white/20 shrink-0"
        animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <Sparkles className="w-5 h-5 text-white" />
      </motion.div>

      <motion.div 
        className="absolute -bottom-6 -right-6 z-30 w-14 h-14 rounded-2xl bg-[#60A5FA] flex items-center justify-center shadow-xl shadow-[#3B82F6]/30 border border-white/20 shrink-0"
        animate={shouldReduceMotion ? {} : { y: [0, 8, 0], rotate: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
      >
        <GraduationCap className="w-6 h-6 text-white" />
      </motion.div>

      {/* Main Card */}
      <div className="relative rounded-[32px] border border-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.08)] bg-white overflow-hidden flex flex-col text-left z-20 h-[500px]">
        <div className="p-6 sm:p-8 lg:px-10 lg:pt-10 lg:pb-8 flex flex-col w-full h-full justify-between">
          
          {/* Document Header */}
          <div className="flex items-start justify-between w-full mb-8 gap-4">
            <div className="flex gap-4 items-center min-w-0">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#F0F7FF] flex items-center justify-center shadow-sm border border-[#168BFF]/20">
                <FileText className="w-7 h-7 text-[#168BFF]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#0F172A] mb-1 truncate">Neuroscience Chapter 4.pdf</h3>
                <p className="text-[13px] font-medium text-[#64748B] truncate">2.4 MB · PDF Document</p>
              </div>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-full bg-[#F0F7FF] text-[#168BFF] text-[12px] font-bold border border-[#168BFF]/20">
              Active Session
            </span>
          </div>

          {/* Workflow Steps */}
          <div className="flex flex-col gap-3.5 my-auto w-full">
            {workflowSteps.map((step, idx) => {
              const isCompleted = idx < completedCount;
              const isCurrent = idx === completedCount;

              let icon = null;
              if (isCompleted) {
                icon = <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />;
              } else if (isCurrent && step.isLoader) {
                icon = <Loader2 className="w-5 h-5 text-[#168BFF] animate-spin shrink-0" />;
              } else if (isCurrent) {
                icon = <Sparkles className="w-5 h-5 text-[#7C3AED] animate-pulse shrink-0" />;
              } else {
                icon = <div className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] shrink-0" />;
              }

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#F0FDF4] border-[#10B981]/30 text-[#0F172A]"
                      : isCurrent
                      ? "bg-[#F0F7FF] border-[#168BFF]/40 shadow-sm text-[#0F172A]"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {icon}
                    <span className="text-[14px] font-semibold truncate">{step.label}</span>
                  </div>

                  {isCurrent && progress !== null && (
                    <span className="text-[13px] font-bold text-[#168BFF] shrink-0 ml-2">{progress}%</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Card Footer Progress Bar */}
          <div className="pt-4 border-t border-[#E2E8F0] mt-auto w-full flex flex-col gap-2">
            <div className="flex justify-between items-center text-[12px] font-semibold text-[#64748B]">
              <span>Overall Processing</span>
              <span>{Math.min(100, (stepIndex / workflowSteps.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#168BFF] to-[#7C3AED] transition-all duration-500 rounded-full"
                style={{ width: `${(stepIndex / workflowSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <LandingSection spacing="none" className="pt-[140px] lg:pt-[160px] pb-16 sm:pb-24 lg:pb-32 bg-[#F8FAFC]">
      {/* Background Patterns */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 75% 45%, rgba(124, 58, 237, 0.03), transparent 45%), radial-gradient(circle at 25% 60%, rgba(22, 139, 255, 0.03), transparent 45%)",
        }}
      />

      <LandingContainer variant="default" className="relative z-10 flex flex-col">
        {/* Main Hero Content Split */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
          
          {/* Left Side: Text Content */}
          <motion.div
            className="w-full lg:w-[45%] xl:w-[44%] shrink-0 flex flex-col items-start text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-8">
              <LandingBadge variant="primary" icon={<Sparkles className="w-4 h-4 text-[#168BFF]" />}>
                AI Study Platform for Students
              </LandingBadge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-black tracking-tight text-[#0F172A] mb-6 w-full text-4xl sm:text-5xl lg:text-6xl leading-[1.08]"
            >
              Turn Every Lecture<br />
              Into Your<br />
              <span className="text-[#5964FF]">
                Best Grade.
              </span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              variants={itemVariants}
              className="mb-10 text-[#475569] text-base sm:text-lg leading-[1.7] w-full max-w-[560px]"
            >
              Upload your lecture notes, slides, or PDFs and let StudFlow instantly transform them into concise summaries, interactive flashcards, and personalized quizzes.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-start gap-4 mb-10 w-full sm:w-auto">
              <LandingButton
                href="/dashboard/upload"
                variant="primary"
                size="lg"
                className="w-full sm:w-fit"
                icon={<ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5 shrink-0" />}
              >
                Start Studying Free
              </LandingButton>
              <LandingButton
                href="#how-it-works"
                variant="outline"
                size="lg"
                className="w-full sm:w-fit"
                icon={<PlayCircle className="w-5 h-5 text-[#5964FF] shrink-0" />}
              >
                See how it works
              </LandingButton>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-start gap-x-8 gap-y-4 w-full"
            >
              {trustItems.map((item, index) => (
                <span key={index} className="flex items-center gap-2 text-[14px] sm:text-[15px] text-[#475569] font-medium whitespace-nowrap shrink-0">
                  <span className="text-lg">{item.emoji}</span>
                  {item.text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side: Interactive Product Preview */}
          <motion.div
            className="w-full lg:w-[50%] xl:w-[52%] shrink-0 relative z-20 flex justify-center lg:justify-end mt-12 lg:mt-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <ProductPreview />
          </motion.div>
        </div>

        {/* Bottom Banner: Universities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="mt-20 lg:mt-32 w-full"
        >
          <LandingCard variant="default" padding="md" radius="2xl" hoverEffect={false} className="flex flex-col md:flex-row items-center justify-between gap-8">
            <span className="text-[14px] font-semibold text-[#64748B] shrink-0 uppercase tracking-wide">
              Trusted by students from
            </span>
            
            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-current opacity-70 flex items-center justify-center text-[10px] font-bold">AU</div>
                <span className="text-[13px] font-bold uppercase">Ateneo de Manila<br/>University</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-current opacity-70 flex items-center justify-center text-[10px] font-bold">UP</div>
                <span className="text-[13px] font-bold uppercase">University of the<br/>Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-current opacity-70 flex items-center justify-center text-[10px] font-bold">DLSU</div>
                <span className="text-[13px] font-bold uppercase">De La Salle<br/>University</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-current opacity-70 flex items-center justify-center text-[10px] font-bold">MU</div>
                <span className="text-[13px] font-bold uppercase">Mapúa<br/>University</span>
              </div>
            </div>
            
            <span className="text-[14px] font-bold text-[#5964FF] shrink-0">
              and 500+ more
            </span>
          </LandingCard>
        </motion.div>
        
      </LandingContainer>
    </LandingSection>
  );
}
