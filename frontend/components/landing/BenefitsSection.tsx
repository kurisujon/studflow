"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { TrendingUp, Zap, ShieldCheck, CheckCircle, Sparkles, Flame, LayoutDashboard, Brain, Target } from "lucide-react";
import { LandingSection } from "./ui/LandingSection";
import { LandingContainer } from "./ui/LandingContainer";
import { LandingHeading } from "./ui/LandingHeading";
import { LandingCard } from "./ui/LandingCard";

// ── Benefits data ────────────────────────────────────────────────────────────
const benefits = [
  {
    icon: TrendingUp,
    title: "10+ Hours Saved Weekly",
    description: "Automate note organization, summarization, and flashcard creation so you can focus on active learning.",
    badge: "Efficiency",
    color: "text-[#168BFF]",
    bgColor: "bg-[#F0F7FF]",
    badgeColor: "text-[#168BFF] bg-[#F0F7FF]",
  },
  {
    icon: Zap,
    title: "Long-term Memory Boost",
    description: "Built-in Spaced Repetition System (SRS) ensures information transfers to long-term memory effortlessly.",
    badge: "Scientifically Proven",
    color: "text-[#4F46E5]",
    bgColor: "bg-[#EEEDFC]",
    badgeColor: "text-[#4F46E5] bg-[#EEEDFC]",
  },
  {
    icon: Brain,
    title: "AI-Grounded Accuracy",
    description: "Every generated summary and quiz answer cites its exact source chunk from your uploaded PDF.",
    badge: "Zero Hallucination",
    color: "text-[#7C3AED]",
    bgColor: "bg-[#F5F3FF]",
    badgeColor: "text-[#7C3AED] bg-[#F5F3FF]",
  },
  {
    icon: ShieldCheck,
    title: "Exam Readiness Score",
    description: "Track your real-time mastery stats across subjects to know exactly when you're ready to ace your exam.",
    badge: "Analytics",
    color: "text-[#2563EB]",
    bgColor: "bg-[#EFF6FF]",
    badgeColor: "text-[#2563EB] bg-[#EFF6FF]",
  },
];

// ── Live Interactive Dashboard Showcase Component ─────────────────────────────
function LiveDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "flashcards" | "quizzes">("overview");
  const [streakCount, setStreakCount] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setStreakCount((prev) => (prev >= 7 ? 1 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full rounded-[32px] border border-[#E2E8F0] bg-white shadow-[0_24px_80px_rgba(79,70,229,0.08)] overflow-hidden flex flex-col">
      {/* Dashboard Top Header Bar */}
      <div className="h-14 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          <span className="ml-2 text-xs font-bold text-[#64748B]">StudFlow Dashboard</span>
        </div>

        {/* Dynamic Streak Badge */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm"
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>{streakCount} Day Streak!</span>
        </motion.div>
      </div>

      {/* Main Body */}
      <div className="p-6 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] rounded-xl text-xs font-semibold w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "overview" ? "bg-white text-[#0F172A] shadow-sm font-bold" : "text-[#64748B]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "flashcards" ? "bg-white text-[#0F172A] shadow-sm font-bold" : "text-[#64748B]"
            }`}
          >
            Flashcards (24)
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "quizzes" ? "bg-white text-[#0F172A] shadow-sm font-bold" : "text-[#64748B]"
            }`}
          >
            Quizzes (3)
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#F0F7FF] border border-[#168BFF]/20 flex flex-col">
                    <span className="text-[11px] font-semibold text-[#168BFF]">Total Documents</span>
                    <span className="text-xl font-bold text-[#0F172A]">14 Files</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#EEEDFC] border border-[#4F46E5]/20 flex flex-col">
                    <span className="text-[11px] font-semibold text-[#4F46E5]">Cards Due Today</span>
                    <span className="text-xl font-bold text-[#0F172A]">8 Reviews</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F5F3FF] border border-[#7C3AED]/20 flex flex-col">
                    <span className="text-[11px] font-semibold text-[#7C3AED]">Avg Quiz Score</span>
                    <span className="text-xl font-bold text-[#0F172A]">92%</span>
                  </div>
                </div>

                {/* Progress Bar Item */}
                <div className="p-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                    <span>Neuroscience_Ch4_Final.pdf</span>
                    <span className="text-[#10B981]">85% Mastered</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#EEEDFC] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#168BFF] to-[#10B981] w-[85%] rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "flashcards" && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-3"
              >
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] relative overflow-hidden group">
                  <span className="text-[10px] font-bold text-[#7C3AED] uppercase bg-[#F5F3FF] px-2 py-0.5 rounded-full">
                    Due Today · Spaced Repetition
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#0F172A] mt-2">What is synaptic pruning?</p>
                </div>
              </motion.div>
            )}

            {activeTab === "quizzes" && (
              <motion.div
                key="quizzes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-3"
              >
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] relative overflow-hidden group">
                  <span className="text-[10px] font-bold text-[#168BFF] uppercase bg-[#F0F7FF] px-2 py-0.5 rounded-full">
                    Adaptive Quiz · 10 Questions
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#0F172A] mt-2">Neuroscience & Action Potentials</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info pill */}
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Spaced repetition algorithm updated for 2 cards today!</span>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-200/50 px-2.5 py-1 rounded-full">Awesome! 🎉</span>
        </motion.div>
      </div>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────
export function BenefitsSection() {
  return (
    <LandingSection id="benefits" background="card" spacing="xl">
      {/* Subtle Background Gradients */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#168BFF]/5 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-bl from-[#7C3AED]/5 to-transparent rounded-full blur-[100px]" />
      </div>

      <LandingContainer variant="default" className="relative z-10 flex flex-col">
        <div className="flex flex-col lg:flex-row items-center gap-16 xl:gap-24">
          {/* Left Column: Benefits Content */}
          <motion.div 
            className="flex-1 w-full"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-12">
              <h2 className="font-black text-[#0F172A] tracking-tight mb-5 leading-[1.1] text-3xl sm:text-4xl lg:text-5xl">
                Study smarter, not harder. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#168BFF] to-[#4F46E5]">Seriously.</span>
              </h2>
              <p className="text-[#475569] leading-relaxed max-w-[500px] text-base sm:text-lg">
                StudFlow was built for students who want to maximize grades while reclaiming their free time. We combine proven frameworks with cutting-edge AI.
              </p>
            </div>
            
            {/* Benefits Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefits.map((benefit, idx) => (
                <LandingCard
                  key={idx}
                  variant="default"
                  padding="sm"
                  radius="xl"
                  hoverEffect={true}
                  className="flex flex-col gap-4 group"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${benefit.bgColor} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                      <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded-md ${benefit.badgeColor}`}>
                      {benefit.badge}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-[#0F172A] mb-1.5 text-base group-hover:text-[#168BFF] transition-colors">{benefit.title}</h3>
                    <p className="text-xs text-[#475569] leading-[1.6]">{benefit.description}</p>
                  </div>
                </LandingCard>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Interactive Dashboard Preview */}
          <motion.div 
            className="flex-1 w-full relative"
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-[#168BFF]/20 via-[#4F46E5]/20 to-[#7C3AED]/20 blur-[80px] pointer-events-none" />
            <LiveDashboard />
          </motion.div>

        </div>
      </LandingContainer>
    </LandingSection>
  );
}
