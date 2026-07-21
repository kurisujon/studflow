"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { ArrowRight, Sparkles, FileText, CheckCircle, PlayCircle, Loader2, BookOpen, Layers } from "lucide-react";

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

  useEffect(() => {
    const duration = 2000; // ms per step

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
    <div className="relative w-full max-w-[540px] mx-auto z-10">
      {/* ── Background decoration behind card ── */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-30 pointer-events-none" />
      <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-gradient-to-br from-[#168BFF]/10 to-[#7C3AED]/20 blur-[60px] rounded-full pointer-events-none" />

      {/* ── Floating Badges ── */}
      <motion.div 
        className="absolute -top-6 right-8 z-30 w-12 h-12 rounded-xl bg-gradient-to-br from-[#A78BFA] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30 border border-white/20"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <Sparkles className="w-5 h-5 text-white" />
      </motion.div>

      <motion.div 
        className="absolute -bottom-6 -right-6 z-30 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#60A5FA] to-[#3B82F6] flex items-center justify-center shadow-xl shadow-[#3B82F6]/30 border border-white/20"
        animate={{ y: [0, 8, 0], rotate: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
      >
        <BookOpen className="w-6 h-6 text-white" />
      </motion.div>

      {/* ── Main Card ── */}
      <div className="relative rounded-[32px] border border-white/80 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] bg-white/95 backdrop-blur-2xl overflow-hidden flex flex-col text-left z-20 h-[500px]">
        <div className="p-8 lg:px-10 lg:pt-10 lg:pb-8 flex flex-col w-full h-full justify-between">
          
          {/* Document Header */}
          <div className="flex items-start justify-between w-full mb-8">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F0F7FF] flex items-center justify-center shadow-sm border border-[#168BFF]/20">
                <FileText className="w-7 h-7 text-[#168BFF]" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#0F172A] mb-1">Neuroscience Chapter 4.pdf</h3>
                <p className="text-[13px] font-medium text-[#64748B]">2.4 MB · PDF Document</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]">
              <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span className="text-[12px] font-bold text-[#0F172A]">24 Cards</span>
            </div>
          </div>

          {/* Workflow Steps List */}
          <div className="flex flex-col gap-5 flex-1 justify-center relative">
            {/* Connecting Line background */}
            <div className="absolute left-4 top-2 bottom-6 w-[2px] bg-[#F1F5F9] -z-10" />

            {workflowSteps.map((step, i) => {
              const isDone = i < completedCount;
              const isCurrent = i === stepIndex;
              const isFuture = i > stepIndex;
              
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className={`flex items-center justify-between w-full transition-all duration-300 ${
                    isFuture ? "opacity-30" : "opacity-100"
                  }`}>
                    <div className="flex items-center gap-4">
                      {/* Icon Indicator */}
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-[#E2E8F0] flex items-center justify-center z-10 shrink-0">
                        {isDone ? (
                          <CheckCircle className="w-5 h-5 text-[#3B82F6] fill-blue-50" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-[#7C3AED] animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-[#E2E8F0]" />
                        )}
                      </div>
                      <span className={`text-[15px] font-medium ${isCurrent ? "text-[#0F172A]" : "text-[#475569]"}`}>
                        {step.label}
                      </span>
                    </div>
                    {isCurrent && step.isLoader && (
                      <span className="text-[14px] font-bold text-[#475569]">{progress}%</span>
                    )}
                  </div>
                  
                  {/* Progress bar below current step */}
                  {isCurrent && step.isLoader && (
                    <div className="pl-12 pr-2">
                      <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[#4F7BFF] to-[#7C3AED]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Retention Card */}
          <div className="w-full mt-6 flex items-center justify-between pt-6 border-t border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Exam Confidence</span>
                <span className="text-[16px] font-black text-[#0F172A]">High · 94% retention</span>
              </div>
            </div>
            
            {/* Circular Progress */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#EEEDFC"
                  strokeWidth="4"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="4"
                  strokeDasharray="100, 100"
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: "94, 100" }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                />
              </svg>
              <div className="absolute flex items-center justify-center">
                <span className="text-[14px] font-bold text-[#0F172A]">94%</span>
              </div>
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
    <section className="landing-section landing-hero relative w-full bg-[#F8FAFC]">
      {/* ── Background Patterns ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Soft grid */}
        <div className="absolute left-[10%] top-[20%] w-[400px] h-[400px] bg-[url('/grid-pattern.svg')] opacity-20" />
        
        {/* Large soft color blobs */}
        <div className="absolute top-[10%] right-[-10%] w-[900px] h-[900px] rounded-full bg-gradient-to-b from-[#168BFF]/5 to-[#7C3AED]/5 blur-[100px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#4F46E5]/10 to-transparent blur-[120px] opacity-50" />
      </div>

      <div className="landing-container relative z-10 flex flex-col pb-20">
        
        {/* Main Hero Content Split */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-10">
          
          {/* ── Left Side: Text Content ─────────────────────────────── */}
          <motion.div
            className="w-full lg:w-[50%] flex flex-col items-start text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0F7FF] border border-[#168BFF]/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-[#168BFF]" />
              <span className="text-[13px] font-bold text-[#168BFF] tracking-wide uppercase">AI Study Platform for Students</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-black tracking-tight text-[#0F172A] leading-[1.15] mb-6"
              style={{ fontSize: "clamp(2.75rem, 5vw, 4.5rem)" }}
            >
              Turn Every Lecture<br />
              Into Your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7BFF] to-[#7C5CFF]">
                Best Grade.
              </span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              variants={itemVariants}
              className="mb-10 text-[#475569] leading-relaxed max-w-[540px]"
              style={{ fontSize: "clamp(1.125rem, 1.5vw, 1.25rem)" }}
            >
              Upload your lecture notes, slides, or PDFs and let StudFlow instantly transform them into concise summaries, interactive flashcards, and personalized quizzes.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-start gap-4 w-full sm:w-auto mb-16">
              <Link
                href="/dashboard/upload"
                className="group relative flex items-center justify-center gap-2 w-full sm:w-auto h-[56px] px-8 rounded-[14px] text-[16px] font-bold text-white bg-gradient-to-r from-[#5964FF] to-[#8640FF] shadow-[0_12px_24px_-8px_rgba(89,100,255,0.4)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_32px_-8px_rgba(89,100,255,0.6)] hover:border-[#8640FF]/30 border border-transparent whitespace-nowrap overflow-hidden"
              >
                {/* Highlight bar effect */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                Start Studying Free
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
              <Link
                href="#how-it-works"
                className="group relative flex items-center justify-center gap-2 w-full sm:w-auto h-[56px] px-8 rounded-[14px] text-[16px] font-bold text-[#0F172A] bg-white border border-[#E2E8F0] shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-[#CBD5E1] whitespace-nowrap overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E2E8F0] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <PlayCircle className="w-5 h-5 text-[#0F172A]" />
                See how it works
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-start gap-x-8 gap-y-4"
            >
              {trustItems.map((item, index) => (
                <span key={index} className="flex items-center gap-2 text-[14px] text-[#475569] font-medium">
                  <span className="text-lg">{item.emoji}</span>
                  {item.text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right Side: Interactive Product Preview ───────────────────────── */}
          <motion.div
            className="w-full lg:w-[50%] relative z-20 flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <ProductPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
