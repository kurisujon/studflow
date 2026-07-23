"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { UploadCloud, Cpu, Target, FileText, CheckCircle, Sparkles, Layers, FileImage } from "lucide-react";
import { LandingSection } from "./ui/LandingSection";
import { LandingContainer } from "./ui/LandingContainer";
import { LandingHeading } from "./ui/LandingHeading";
import { LandingBadge } from "./ui/LandingBadge";

// ── Step Definitions ────────────────────────────────────────────────────────
const steps = [
  {
    step: "01",
    title: "Upload Your Materials",
    description: "Drop any PDF or DOCX file — lecture slides, textbook chapters, or handwritten notes.",
    icon: UploadCloud,
    color: "text-[#168BFF]",
    bgColor: "bg-[#F0F7FF]",
    glowColor: "shadow-[#168BFF]/10",
    gradient: "from-[#168BFF] to-[#0066CC]",
  },
  {
    step: "02",
    title: "AI Processing",
    description: "Our specialized study engines analyze, summarize, and chunk your document in seconds.",
    icon: Cpu,
    color: "text-[#7C3AED]",
    bgColor: "bg-[#F5F3FF]",
    glowColor: "shadow-[#7C3AED]/10",
    gradient: "from-[#7C3AED] to-[#5B21B6]",
  },
  {
    step: "03",
    title: "Study & Retain",
    description: "Review auto-generated summaries, flip flashcards with SRS, and test yourself with quizzes.",
    icon: Target,
    color: "text-[#4F46E5]",
    bgColor: "bg-[#EEEDFC]",
    glowColor: "shadow-[#4F46E5]/10",
    gradient: "from-[#4F46E5] to-[#3730A3]",
  },
];

// ── Step 1 Animated Preview: Interactive Drag & Drop Box ────────────────────
function Step1Preview() {
  const [isHovered, setIsHovered] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setUploaded((prev) => !prev);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="p-4 rounded-2xl border border-dashed border-[#168BFF]/40 bg-white shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 relative overflow-hidden group min-h-[110px]"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl transition-all duration-300 ${uploaded ? "bg-[#F0FDF4] text-[#10B981]" : "bg-[#F0F7FF] text-[#168BFF]"}`}>
          {uploaded ? <FileText className="w-6 h-6 animate-bounce" /> : <FileImage className="w-6 h-6" />}
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-[#0F172A]">
            {uploaded ? "Bio_Lecture_3.pdf" : "Drag & drop PDF here"}
          </p>
          <p className="text-[11px] text-[#64748B]">
            {uploaded ? "2.4 MB · Uploaded" : "Supports up to 50 MB"}
          </p>
        </div>
      </div>
      {uploaded && (
        <span className="mt-2 text-[10px] font-bold text-[#10B981] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#10B981]/20">
          Ready for processing ✓
        </span>
      )}
    </div>
  );
}

// ── Step 2 Animated Preview: AI Analysis Pulse Box ──────────────────────────
function Step2Preview() {
  const [activeChip, setActiveChip] = useState(0);
  const chips = ["Extraction", "Summarizing", "Quiz Generating"];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveChip((prev) => (prev + 1) % chips.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [chips.length]);

  return (
    <div className="p-4 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex flex-col gap-2.5 min-h-[110px] justify-center">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-spin" /> AI Engine Active
        </span>
        <span className="text-[10px] font-semibold text-[#94A3B8]">FastAPI + Gemini</span>
      </div>

      <div className="flex gap-1.5 overflow-hidden">
        {chips.map((chip, i) => (
          <span
            key={chip}
            className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-all duration-300 ${
              i === activeChip
                ? "bg-[#7C3AED] text-white shadow-sm scale-105"
                : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]"
            }`}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Step 3 Animated Preview: Interactive Mastery Stats Badge ───────────────
function Step3Preview() {
  return (
    <div className="p-4 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex items-center justify-between min-h-[110px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#EEEDFC] text-[#4F46E5] flex items-center justify-center font-bold">
          <Layers className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-[#0F172A]">Quiz Score: 94%</p>
          <p className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Mastered Topic
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-xs font-bold text-[#4F46E5] bg-[#EEEDFC] px-2.5 py-1 rounded-full border border-[#4F46E5]/20">
          +45 XP
        </span>
      </div>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────
export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end center"],
  });

  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <LandingSection id="how-it-works" background="default" spacing="lg" ref={containerRef}>
      {/* Background embellishments */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#168BFF]/5 to-transparent rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#7C3AED]/5 to-transparent rounded-full blur-[80px]" />
      </div>

      <LandingContainer variant="default" className="relative z-10 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <LandingHeading
            level={2}
            badge={
              <LandingBadge variant="secondary" icon={<Zap className="w-3.5 h-3.5 text-[#4F46E5]" />}>
                Workflow
              </LandingBadge>
            }
            subtitle="Stop spending hours preparing study materials. Let StudFlow do the heavy lifting so you can focus on actually learning."
          >
            From document to mastery in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]">3 steps</span>
          </LandingHeading>
        </motion.div>

        <div className="relative">
          {/* Desktop Horizontal Timeline Line */}
          <div className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-1 bg-[#E2E8F0] rounded-full z-0 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#168BFF] via-[#7C3AED] to-[#4F46E5]"
              style={{ width: lineWidth }}
            />
          </div>

          {/* Mobile Vertical Timeline Line */}
          <div className="block lg:hidden absolute top-10 bottom-10 left-[48px] md:left-1/2 md:-translate-x-1/2 w-1 bg-[#E2E8F0] rounded-full z-0 overflow-hidden">
            <motion.div 
              className="w-full bg-gradient-to-b from-[#168BFF] via-[#7C3AED] to-[#4F46E5]"
              style={{ height: lineHeight }}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 relative z-10">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: idx * 0.2, ease: "easeOut" }}
                className="flex flex-col lg:items-center text-left lg:text-center group relative pl-[100px] lg:pl-0"
              >
                {/* Step Number Badge + Icon Container */}
                <div className="absolute left-0 lg:static lg:mx-auto">
                  <div className={`w-24 h-24 rounded-full ${step.bgColor} border-4 border-white shadow-xl ${step.glowColor} flex items-center justify-center mb-6 relative transition-transform duration-400 ease-out group-hover:scale-105`}>
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center font-black text-[#0F172A] text-sm z-20"
                    >
                      {idx + 1}
                    </motion.div>
                    
                    <step.icon className={`w-10 h-10 ${step.color} relative z-10 transition-transform duration-300 group-hover:scale-110`} />
                    
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
                  </div>
                </div>
                
                {/* Text Content */}
                <h3 className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#0F172A] group-hover:to-[#475569] transition-all duration-300">
                  {step.title}
                </h3>
                
                <p className="text-[#475569] leading-relaxed max-w-sm mb-6 text-sm lg:text-base">
                  {step.description}
                </p>

                {/* Mini UI Previews */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (idx * 0.2) }}
                  className="w-full max-w-[280px] mx-0 lg:mx-auto"
                >
                  {idx === 0 && <Step1Preview />}
                  {idx === 1 && <Step2Preview />}
                  {idx === 2 && <Step3Preview />}
                </motion.div>

              </motion.div>
            ))}
          </div>
        </div>
      </LandingContainer>
    </LandingSection>
  );
}

// Internal icon for workflow header
const Zap = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
