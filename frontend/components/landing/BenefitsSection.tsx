"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { TrendingUp, Zap, ShieldCheck, CheckCircle, Sparkles, Flame, LayoutDashboard, Brain, Target } from "lucide-react";

// --- Icons ---
const ClockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const benefits = [
  {
    title: "Save 10+ hours a week",
    description: "Skip the tedious process of highlighting and outlining. Let AI extract the core knowledge instantly.",
    icon: ClockIcon,
    badge: "⏱ Save Time",
    color: "text-[#168BFF]",
    bgColor: "bg-gradient-to-br from-[#EBF5FF] to-[#F0F7FF]",
    badgeColor: "text-[#168BFF] bg-[#F0F7FF]",
  },
  {
    title: "Boost retention by 300%",
    description: "Active recall and spaced repetition are scientifically proven to drastically improve memory retention.",
    icon: TrendingUp,
    badge: "🧠 Active Recall",
    color: "text-[#4F46E5]",
    bgColor: "bg-gradient-to-br from-[#EEEDFC] to-[#F0EDFF]",
    badgeColor: "text-[#4F46E5] bg-[#EEEDFC]",
  },
  {
    title: "Eliminate study fatigue",
    description: "No more staring blankly at dense textbooks. Interactive quizzes and flashcards keep you engaged.",
    icon: Zap,
    badge: "⚡ Faster Learning",
    color: "text-[#7C3AED]",
    bgColor: "bg-gradient-to-br from-[#F0EBFF] to-[#F5F3FF]",
    badgeColor: "text-[#7C3AED] bg-[#F5F3FF]",
  },
  {
    title: "Learn with confidence",
    description: "Answers are grounded directly in your uploaded material, ensuring you study only accurate, relevant facts.",
    icon: ShieldCheck,
    badge: "📚 AI Generated",
    color: "text-[#2563EB]",
    bgColor: "bg-gradient-to-br from-[#EBF2FF] to-[#EFF6FF]",
    badgeColor: "text-[#2563EB] bg-[#EFF6FF]",
  }
];

// --- Live Dashboard Preview Component ---
function LiveDashboard() {
  const [flashcards, setFlashcards] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Count up animations
    const flashcardInterval = setInterval(() => {
      setFlashcards(prev => {
        if (prev >= 350) {
          clearInterval(flashcardInterval);
          return 350;
        }
        return prev + 15;
      });
    }, 40);

    const quizInterval = setInterval(() => {
      setQuizScore(prev => {
        if (prev >= 92) {
          clearInterval(quizInterval);
          return 92;
        }
        return prev + 4;
      });
    }, 40);

    // Floating notification trigger
    const notificationTimer = setTimeout(() => {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 2500);

    return () => {
      clearInterval(flashcardInterval);
      clearInterval(quizInterval);
      clearTimeout(notificationTimer);
    };
  }, []);

  return (
    <div className="relative rounded-[32px] bg-white border border-[#E2E8F0] shadow-[0_20px_60px_rgba(79,70,229,0.06)] p-6 lg:p-8 overflow-hidden w-full max-w-[500px] mx-auto lg:mx-0">
      
      {/* Decorative Dashboard Header */}
      <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#168BFF] via-[#4F46E5] to-[#7C3AED]" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#168BFF]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[11px] font-medium">Quiz Generated</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-md">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#0F172A] leading-tight">Weekly Progress</h3>
          <p className="text-xs text-[#475569]">Updated just now</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        
        {/* Metric 1 */}
        <div>
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span className="text-[#475569] flex items-center gap-1.5"><Brain className="w-4 h-4 text-[#4F46E5]" /> Flashcards Generated</span>
            <span className="text-[#4F46E5] text-base">{flashcards}</span>
          </div>
          <div className="w-full h-2.5 bg-[#EEEDFC] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "85%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#168BFF] to-[#4F46E5]" 
            />
          </div>
        </div>
        
        {/* Metric 2 */}
        <div>
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span className="text-[#475569] flex items-center gap-1.5"><Target className="w-4 h-4 text-[#7C3AED]" /> Quiz Score Avg</span>
            <span className="text-[#7C3AED] text-base">{quizScore}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#F5F3FF] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "92%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" 
            />
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F1F5F9]">
          
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#168BFF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[11px] font-semibold text-[#475569] mb-1 uppercase tracking-wider">Time Saved</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-[#168BFF]">14.5<span className="text-sm font-bold">hr</span></p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[11px] font-semibold text-[#475569] mb-1 uppercase tracking-wider">Study Streak</p>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              <p className="text-2xl font-black text-[#0F172A]">7 <span className="text-sm font-bold text-[#475569]">days</span></p>
            </div>
          </div>

        </div>

        {/* Daily Goal */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-100"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 leading-none">Today&apos;s Goal</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">100% Completed</p>
            </div>
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
    <section id="benefits" className="w-full bg-white relative overflow-hidden py-20 lg:py-28">
      
      {/* Subtle Background Gradients */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#168BFF]/5 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-bl from-[#7C3AED]/5 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16 relative z-10 flex flex-col pb-20">
        
        <div className="flex flex-col lg:flex-row items-center gap-16 xl:gap-24">
          
          {/* ── Left Column: Benefits Content ── */}
          <motion.div 
            className="flex-1 w-full"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-12">
              <h2 
                className="font-black text-[#0F172A] tracking-tight mb-5 leading-[1.1]"
                style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)", lineHeight: "1.1" }}
              >
                Study smarter, not harder. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#168BFF] to-[#4F46E5]">Seriously.</span>
              </h2>
              <p className="text-[#475569] leading-relaxed max-w-[500px]" style={{ fontSize: "clamp(1rem, 1.5vw, 1.125rem)" }}>
                StudFlow was built for students who want to maximize grades while reclaiming their free time. We combine proven frameworks with cutting-edge AI.
              </p>
            </div>
            
            {/* Benefits Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefits.map((benefit, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -4 }}
                  className="flex flex-col gap-4 p-5 rounded-[24px] bg-white border border-[#E2E8F0] shadow-[0_20px_60px_rgba(79,70,229,0.06)] hover:shadow-xl transition-all duration-300 ease-out relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${benefit.bgColor} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                      <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                    </div>
                    {/* Tiny Category Badge */}
                    <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded-md ${benefit.badgeColor}`}>
                      {benefit.badge}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-[#0F172A] mb-1.5 text-base group-hover:text-[#168BFF] transition-colors">{benefit.title}</h3>
                    <p className="text-xs text-[#475569] leading-[1.6]">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Right Column: Interactive Dashboard Preview ── */}
          <motion.div 
            className="flex-1 w-full relative"
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            {/* Outer glow behind dashboard */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-[#168BFF]/20 via-[#4F46E5]/20 to-[#7C3AED]/20 blur-[80px] pointer-events-none" />
            
            <LiveDashboard />
          </motion.div>

        </div>
        
      </div>
    </section>
  );
}
