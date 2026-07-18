"use client";

import { motion } from "framer-motion";
// @ts-expect-error - lucide-react types are outdated in this project
import { TrendingUp, Zap, ShieldCheck } from "lucide-react";

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
    color: "text-[#168BFF]",
    bgColor: "bg-[#168BFF]/10",
  },
  {
    title: "Boost retention by 300%",
    description: "Active recall and spaced repetition are scientifically proven to drastically improve memory retention.",
    icon: TrendingUp,
    color: "text-[#4F46E5]",
    bgColor: "bg-[#4F46E5]/10",
  },
  {
    title: "Eliminate study fatigue",
    description: "No more staring blankly at dense textbooks. Interactive quizzes and flashcards keep you engaged.",
    icon: Zap,
    color: "text-[#7C3AED]",
    bgColor: "bg-[#7C3AED]/10",
  },
  {
    title: "Learn with confidence",
    description: "Answers are grounded directly in your uploaded material, ensuring you study only accurate, relevant facts.",
    icon: ShieldCheck,
    color: "text-[#2563EB]",
    bgColor: "bg-[#2563EB]/10",
  }
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="w-full py-24 bg-white">
      <div className="w-full px-5 md:px-12 lg:px-24 mx-auto max-w-[1440px]">
        
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-tight mb-6">
              Study smarter, not harder. <span className="text-[#168BFF]">Seriously.</span>
            </h2>
            <p className="text-lg text-[#64748B] mb-8 leading-relaxed">
              StudFlow was built specifically for students who want to maximize their grades while reclaiming their free time. We combine proven learning frameworks with cutting-edge AI.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:shadow-md transition-shadow">
                  <div className={`shrink-0 w-12 h-12 rounded-xl ${benefit.bgColor} flex items-center justify-center`}>
                    <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] mb-1">{benefit.title}</h3>
                    <p className="text-sm text-[#64748B] leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="flex-1 relative w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Visual element representing a student's success/dashboard */}
            <div className="relative rounded-3xl bg-gradient-to-br from-[#168BFF] via-[#4F46E5] to-[#7C3AED] p-1 shadow-2xl">
              <div className="bg-white rounded-[22px] p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#168BFF]/10 to-transparent rounded-full blur-3xl" />
                
                <h3 className="text-2xl font-bold text-[#0F172A] mb-6">Weekly Progress</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-[#64748B]">Flashcards Mastered</span>
                      <span className="text-[#4F46E5]">342 / 400</span>
                    </div>
                    <div className="w-full h-3 bg-[#EEEDFC] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "85%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-[#168BFF] to-[#4F46E5]" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-[#64748B]">Quiz Average</span>
                      <span className="text-[#7C3AED]">92%</span>
                    </div>
                    <div className="w-full h-3 bg-[#F5F3FF] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "92%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.7 }}
                        className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" 
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">Time Saved</p>
                      <p className="text-3xl font-bold text-[#168BFF]">14.5 hrs</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-[#F0F7FF] flex items-center justify-center">
                      <ClockIcon className="w-8 h-8 text-[#168BFF]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
      </div>
    </section>
  );
}
