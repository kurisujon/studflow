"use client";

import { motion } from "framer-motion";
import Link from "next/link";
// @ts-expect-error - lucide-react types are outdated in this project
import { ArrowRight, Sparkles, FileText, BrainCircuit, GraduationCap } from "lucide-react";

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="landing-section relative w-full pt-[160px] pb-24 md:pb-32 overflow-hidden bg-[#F8FAFC]">
      {/* Background Gradients & Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-gradient-to-b from-[#168BFF]/10 to-[#7C3AED]/5 blur-[120px] opacity-70 transform rotate-12" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-t from-[#4F46E5]/10 to-transparent blur-[100px] opacity-60" />
      </div>

      <div className="landing-container relative z-10 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Text Content */}
        <motion.div 
          className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-3xl lg:max-w-2xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-[#168BFF]" />
            <span className="text-sm font-semibold text-[#0F172A]">The Ultimate Study OS for Students</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="font-bold tracking-tight text-[#0F172A] leading-[1.1] mb-5 text-[clamp(2.2rem,5vw,4.5rem)]">
            Turn your notes into <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#168BFF] via-[#4F46E5] to-[#7C3AED]">
              perfect grades.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="mb-8 text-[#64748B] leading-relaxed max-w-xl text-[clamp(1rem,2vw,1.125rem)]">
            Upload your lectures, slides, and readings. StudFlow instantly generates smart summaries, active-recall flashcards, and personalized quizzes to help you learn faster.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/dashboard/upload" 
              className="w-full sm:w-auto h-12 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#168BFF] to-[#2563EB] hover:shadow-xl hover:shadow-[#168BFF]/30 transition-all duration-300 ease-out transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start Studying Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="#how-it-works" 
              className="w-full sm:w-auto h-12 px-6 rounded-xl text-sm font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all duration-300 ease-out flex items-center justify-center"
            >
              See how it works
            </Link>
          </motion.div>
        </motion.div>

        {/* Visual Composition */}
        <motion.div 
          className="flex-1 relative w-full max-w-lg lg:max-w-none"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Main Mockup Card */}
          <div className="relative rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl p-6 lg:p-8 z-20 overflow-hidden group w-full">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#168BFF] via-[#4F46E5] to-[#7C3AED]" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-[#F0F7FF] flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#168BFF]" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F172A] text-lg">Neuroscience Chapter 4.pdf</h3>
                <p className="text-sm text-[#64748B]">Processing document...</p>
              </div>
            </div>

            <div className="space-y-4 relative">
              {/* Skeleton lines with animated shimmer */}
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-3 rounded-full bg-[#F1F5F9] relative overflow-hidden ${i === 3 ? 'w-2/3' : 'w-full'}`}>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: i * 0.2 }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-sm font-semibold text-[#0F172A]">AI Summary</span>
                </div>
                <div className="h-2 w-1/2 bg-[#E2E8F0] rounded-full" />
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-sm font-semibold text-[#0F172A]">Flashcards</span>
                </div>
                <div className="h-2 w-1/2 bg-[#E2E8F0] rounded-full" />
              </div>
            </div>
          </div>

          {/* Decorative floating elements */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -top-8 -right-8 w-24 h-24 rounded-2xl bg-white border border-[#E2E8F0] shadow-xl flex items-center justify-center z-30"
          >
            <span className="text-4xl">A+</span>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 5, delay: 1 }}
            className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white border border-[#E2E8F0] shadow-xl flex items-center justify-center z-30"
          >
            <div className="w-10 h-10 rounded-full bg-[#F0F7FF] flex items-center justify-center text-[#168BFF] font-bold">
              100%
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
