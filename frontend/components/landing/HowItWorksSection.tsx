"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { UploadCloud, Cpu, Target, FileText, CheckCircle, Sparkles, Layers, FileImage } from "lucide-react";

const steps = [
  {
    title: "Upload Material",
    description: "Drag and drop your PDF or DOCX file. Lecture slides, textbook chapters, or personal notes.",
    icon: UploadCloud,
    color: "text-[#168BFF]",
    bgColor: "bg-gradient-to-br from-[#EBF5FF] to-[#F0F7FF]",
    borderColor: "border-[#168BFF]/20",
    glowColor: "shadow-[#168BFF]/20",
    gradient: "from-[#168BFF] to-[#4F46E5]",
  },
  {
    title: "AI Processing",
    description: "Our document AI reads, extracts, and understands the core concepts in seconds.",
    icon: Cpu,
    color: "text-[#7C3AED]",
    bgColor: "bg-gradient-to-br from-[#F0EBFF] to-[#F5F3FF]",
    borderColor: "border-[#7C3AED]/20",
    glowColor: "shadow-[#7C3AED]/20",
    gradient: "from-[#7C3AED] to-[#4F46E5]",
  },
  {
    title: "Study Actively",
    description: "Review summaries, flip flashcards, and test yourself with adaptive quizzes.",
    icon: Target,
    color: "text-[#4F46E5]",
    bgColor: "bg-gradient-to-br from-[#EEEDFC] to-[#F0EDFF]",
    borderColor: "border-[#4F46E5]/20",
    glowColor: "shadow-[#4F46E5]/20",
    gradient: "from-[#4F46E5] to-[#7C3AED]",
  }
];

// --- Mini UI Previews ---

function Step1Preview() {
  return (
    <div className="w-full bg-white rounded-[24px] border border-[#E2E8F0] p-4 shadow-[0_20px_60px_rgba(79,70,229,0.06)] flex flex-col gap-3">
      <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC]">
        <div className="w-8 h-8 rounded bg-[#F0F7FF] flex items-center justify-center shrink-0">
          <FileImage className="w-4 h-4 text-[#168BFF]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#0F172A] truncate">Neuroscience_Lec4.pdf</p>
          <p className="text-[10px] text-[#64748B]">2.4 MB · 23 Pages</p>
        </div>
        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
      </div>
      <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}

function Step2Preview() {
  const [tasks, setTasks] = useState([
    { name: "Reading document...", status: 0 },
    { name: "Generating summary", status: 0 },
    { name: "Creating flashcards", status: 0 }
  ]);
  const [globalProgress, setGlobalProgress] = useState(0);

  useEffect(() => {
    let currentTask = 0;
    const interval = setInterval(() => {
      setGlobalProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 1.5;
      });

      setTasks(prev => prev.map((t, i) => {
        if (i === currentTask) {
          if (t.status >= 100) {
            currentTask++;
            return { ...t, status: 100 };
          }
          return { ...t, status: t.status + 3 };
        }
        if (i < currentTask) return { ...t, status: 100 };
        return t;
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white rounded-[24px] border border-[#E2E8F0] p-4 shadow-[0_20px_60px_rgba(79,70,229,0.06)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5]" />
      <div className="flex items-center justify-between mb-3 mt-1">
        <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Processing
        </span>
        <span className="text-xs font-semibold text-[#0F172A]">{Math.floor(globalProgress)}%</span>
      </div>
      
      <div className="space-y-2.5">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border border-[#E2E8F0] flex items-center justify-center shrink-0">
              {task.status === 100 ? (
                <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
              ) : task.status > 0 ? (
                <motion.div 
                  className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              ) : null}
            </div>
            <span className={`text-[11px] font-medium ${task.status === 100 ? "text-[#64748B]" : task.status > 0 ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
              {task.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3Preview() {
  return (
    <div className="w-full bg-white rounded-[24px] border border-[#E2E8F0] p-4 shadow-[0_20px_60px_rgba(79,70,229,0.06)] flex flex-col gap-2 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Ready
        </span>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
      >
        <FileText className="w-4 h-4 text-[#168BFF]" />
        <span className="text-[11px] font-semibold text-[#0F172A]">Summary</span>
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
      >
        <Layers className="w-4 h-4 text-[#4F46E5]" />
        <span className="text-[11px] font-semibold text-[#0F172A]">34 Flashcards</span>
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
      >
        <Target className="w-4 h-4 text-[#7C3AED]" />
        <span className="text-[11px] font-semibold text-[#0F172A]">Adaptive Quiz</span>
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
      </motion.div>
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

  // Grow the progress line from 0 to 100%
  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  // Vertical line for mobile
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="w-full bg-[#F8FAFC] relative overflow-hidden py-20 lg:py-28" ref={containerRef}>
      
      {/* Background embellishments */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#168BFF]/5 to-transparent rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#7C3AED]/5 to-transparent rounded-full blur-[80px]" />
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16 relative z-10 flex flex-col pb-20">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-sm mb-6"
          >
            <Zap className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">Workflow</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#0F172A] font-black tracking-tight mb-5"
            style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)", lineHeight: "1.1" }}
          >
            From document to mastery in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]">3 steps</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#475569] leading-relaxed" 
            style={{ fontSize: "clamp(1rem, 1.8vw, 1.1rem)" }}
          >
            Stop spending hours preparing study materials. Let StudFlow do the heavy lifting so you can focus on actually learning.
          </motion.p>
        </div>

        <div className="relative">
          {/* ── Desktop Horizontal Timeline Line ── */}
          <div className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-1 bg-[#E2E8F0] rounded-full z-0 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#168BFF] via-[#7C3AED] to-[#4F46E5]"
              style={{ width: lineWidth }}
            />
          </div>

          {/* ── Tablet/Mobile Vertical Timeline Line ── */}
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
                    
                    {/* Floating step number */}
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center font-black text-[#0F172A] text-sm z-20"
                    >
                      {idx + 1}
                    </motion.div>
                    
                    <step.icon className={`w-10 h-10 ${step.color} relative z-10 transition-transform duration-300 group-hover:scale-110`} />
                    
                    {/* Soft glow behind icon */}
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
      </div>
    </section>
  );
}

// Internal icon for workflow header
const Zap = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
