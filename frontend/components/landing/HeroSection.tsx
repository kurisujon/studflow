"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as Lucide from "lucide-react";

// Safe import of Lucide icons without causing "no exported member" errors
const { 
  Sparkles, 
  ArrowRight, 
  FileText, 
  MessageSquare, 
  Layers,
  Brain,
  CheckCircle2,
  List
} = Lucide as unknown as Record<string, React.ElementType>;

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full bg-[#0a0e1a] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden selection:bg-indigo-500/30">
      
      {/* Subtle Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff'/%3E%3C/svg%3E")`,
            backgroundSize: '24px 24px'
          }} 
        />
        {/* Animated Radial Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, -30, 0],
            opacity: [0.4, 0.6, 0.4] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0], 
            y: [0, 40, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-20 -right-20 w-[30rem] h-[30rem] bg-blue-600/15 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 mx-auto flex flex-col items-center text-center">
        
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-medium mb-8 backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>AI-Powered Study Workspace</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter text-white leading-[1.1] mb-6"
        >
          Study Smarter. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-400">
            Learn Faster.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Upload your documents. Get instant AI summaries, flashcards, and a personal AI tutor — all in one unified workspace.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-6"
        >
          <Link href="/sign-up">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl text-white font-semibold text-lg shadow-xl shadow-indigo-500/25 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">Start Learning Free</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>
          <Link href="#features">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 font-semibold text-lg transition-colors backdrop-blur-sm"
            >
              View Demo
            </motion.div>
          </Link>
        </motion.div>

        {/* Trust Metrics */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-sm text-white/40 font-medium mb-20"
        >
          10,000+ study sessions &middot; Free to start &middot; No credit card
        </motion.p>

        {/* Layered Dashboard Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-5xl mx-auto aspect-[16/10] md:aspect-[21/9]"
        >
          {/* Main App Window */}
          <div className="absolute inset-0 bg-[#12182b] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col z-10">
            {/* Fake Mac Toolbar */}
            <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs font-medium text-white/30">Studflow Workspace</div>
              <div className="w-16" /> {/* Balancer */}
            </div>

            {/* Three Column Layout */}
            <div className="flex-1 flex w-full h-full">
              {/* Sidebar */}
              <div className="hidden md:flex w-48 border-r border-white/5 flex-col p-4 gap-3 bg-white/[0.01]">
                <div className="h-6 w-24 bg-white/10 rounded-md mb-4" />
                <div className="h-8 w-full bg-white/5 rounded-md flex items-center px-2 gap-2">
                  <div className="w-4 h-4 bg-white/20 rounded" />
                  <div className="h-3 w-16 bg-white/20 rounded" />
                </div>
                <div className="h-8 w-full rounded-md flex items-center px-2 gap-2 opacity-50">
                  <div className="w-4 h-4 bg-white/10 rounded" />
                  <div className="h-3 w-20 bg-white/10 rounded" />
                </div>
                <div className="h-8 w-full rounded-md flex items-center px-2 gap-2 opacity-50">
                  <div className="w-4 h-4 bg-white/10 rounded" />
                  <div className="h-3 w-14 bg-white/10 rounded" />
                </div>
              </div>

              {/* Center Reading Content */}
              <div className="flex-1 p-6 md:p-10 flex flex-col gap-6 overflow-hidden bg-white/[0.01]">
                <div className="h-8 w-2/3 bg-white/10 rounded-lg mb-2" />
                
                <div className="space-y-4">
                  <div className="h-4 w-full bg-white/5 rounded-full" />
                  <div className="h-4 w-full bg-white/5 rounded-full" />
                  <div className="h-4 w-[85%] bg-white/5 rounded-full" />
                </div>
                
                <div className="relative p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mt-4">
                  <div className="absolute -left-2 top-4 w-1 h-8 bg-indigo-500 rounded-full" />
                  <div className="h-4 w-[90%] bg-white/10 rounded-full mb-3" />
                  <div className="h-4 w-[75%] bg-white/10 rounded-full" />
                </div>
                
                <div className="space-y-4">
                  <div className="h-4 w-[95%] bg-white/5 rounded-full" />
                  <div className="h-4 w-[80%] bg-white/5 rounded-full" />
                </div>
              </div>

              {/* Right AI Sidebar */}
              <div className="hidden lg:flex w-72 border-l border-white/5 flex-col bg-[#0a0e1a]">
                <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <div className="h-4 w-20 bg-white/10 rounded" />
                </div>
                <div className="flex-1 p-4 flex flex-col gap-4">
                  {/* AI Message */}
                  <div className="self-start max-w-[85%] bg-white/5 rounded-2xl rounded-tl-sm p-3 border border-white/5">
                    <div className="h-3 w-32 bg-white/20 rounded-full mb-2" />
                    <div className="h-3 w-24 bg-white/20 rounded-full" />
                  </div>
                  {/* User Message */}
                  <div className="self-end max-w-[85%] bg-indigo-600 rounded-2xl rounded-tr-sm p-3">
                    <div className="h-3 w-28 bg-white/40 rounded-full mb-2" />
                    <div className="h-3 w-20 bg-white/40 rounded-full" />
                  </div>
                  {/* AI Typing */}
                  <div className="self-start max-w-[85%] bg-white/5 rounded-2xl rounded-tl-sm p-3 border border-white/5 flex gap-1 items-center h-10">
                    <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                  </div>
                </div>
                <div className="p-4 border-t border-white/5">
                  <div className="h-10 w-full bg-white/5 border border-white/10 rounded-xl flex items-center px-3">
                    <div className="h-3 w-24 bg-white/10 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating UI Elements */}
          <motion.div 
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-6 top-1/4 z-20 hidden md:flex items-center gap-3 px-4 py-3 bg-[#1a2138] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">AI Summary Ready</div>
              <div className="text-[10px] text-white/50">Chapter 4.pdf</div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [10, -10, 10] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-8 top-1/3 z-20 hidden md:flex items-center gap-3 px-4 py-3 bg-[#1a2138] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">24 Flashcards</div>
              <div className="text-[10px] text-white/50">Generated instantly</div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute left-1/4 -bottom-6 z-20 hidden md:flex items-center gap-3 px-4 py-3 bg-[#1a2138] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Quiz Completed</div>
              <div className="text-[10px] text-white/50">Score: 9/10 (90%)</div>
            </div>
          </motion.div>
          
        </motion.div>

      </div>
      
      {/* Bottom fade gradient to blend into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0e1a] to-transparent z-20" />
    </section>
  );
}
