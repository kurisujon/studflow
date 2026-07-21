"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
// We cast Lucide to any to bypass the missing export types in lucide-react 0.x
const { XCircle, CheckCircle2 } = Lucide as unknown as Record<string, React.ElementType>;

export function ComparisonSection() {
  const traditionalMethods = [
    "Manual note-taking",
    "Long, tedious reading sessions",
    "Googling for explanations",
    "No active recall feedback"
  ];

  const studflowMethods = [
    "AI-assisted instant summaries",
    "Focus on true understanding",
    "Your personal AI document tutor",
    "Adaptive active recall quizzes"
  ];

  return (
    <section className="w-full py-[100px] bg-white relative overflow-hidden flex flex-col items-center">
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16 relative z-10 flex flex-col items-center">
        <div className="text-center mb-16 max-w-[800px]">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-black text-[#0F172A] mb-6"
            style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)", lineHeight: "1.1" }}
          >
            A Better Way to Learn
          </motion.h2>
          <p 
            className="text-[#475569] leading-relaxed mx-auto"
            style={{ fontSize: "clamp(1.05rem, 1.3vw, 1.15rem)" }}
          >
            Upgrade your study sessions from outdated manual methods to intelligent, retention-focused learning.
          </p>
        </div>

        <div className="w-full max-w-[1000px] grid md:grid-cols-2 gap-8 relative mx-auto">
          {/* VS Divider on desktop */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full items-center justify-center font-black text-[#0F172A] z-20 shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-[#E2E8F0]">
            VS
          </div>

          {/* Traditional Way */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#F8FAFC] border border-[#E2E8F0] p-10 lg:p-12 rounded-[24px] relative"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100 mb-8 font-bold text-[13px] uppercase tracking-wide">
              Traditional Studying
            </div>
            <ul className="space-y-6">
              {traditionalMethods.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4 text-[#475569]">
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[16px] font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* StudFlow Way */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-[#4F46E5]/20 p-10 lg:p-12 rounded-[24px] relative shadow-[0_20px_60px_rgba(79,70,229,0.06)]"
          >
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#5964FF] to-[#8640FF] opacity-100 rounded-t-[24px]" />
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EEEDFC] text-[#4F46E5] border border-[#4F46E5]/20 mb-8 font-bold text-[13px] uppercase tracking-wide">
              The StudFlow Way
            </div>
            <ul className="space-y-6">
              {studflowMethods.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4 text-[#0F172A]">
                  <CheckCircle2 className="w-6 h-6 text-[#4F46E5] flex-shrink-0 mt-0.5" />
                  <span className="text-[16px] font-bold leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
