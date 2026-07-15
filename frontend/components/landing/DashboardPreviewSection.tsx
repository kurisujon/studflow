"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";

const { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  CircleHelp, 
  LineChart, 
  ChevronRight,
  Bot,
  MessageSquare,
  Highlighter
} = Lucide as unknown as Record<string, React.ElementType>;

export function DashboardPreviewSection() {
  return (
    <section className="w-full py-32 bg-[#0a0e1a] flex flex-col items-center overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-7xl px-4 sm:px-6 text-center mb-20 relative z-10 mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Unified Workspace</span>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
        >
          Everything in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">one place.</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-light"
        >
          Your entire study ecosystem—reading, notes, AI tutoring, flashcards, and quizzes—beautifully integrated into a single distraction-free interface.
        </motion.p>
      </div>

      <div className="w-full max-w-7xl px-4 sm:px-6 mx-auto relative z-10 h-[600px] md:h-[800px] flex justify-center">
        {/* Layer 1: Main PDF/Summary Reader (Back/Center) */}
        <motion.div 
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-0 w-[95%] md:w-[75%] h-[400px] md:h-[600px] bg-[#12182b] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="h-14 border-b border-white/5 bg-white/5 flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="h-4 w-48 bg-white/10 rounded-full" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-6 bg-white/10 rounded-md" />
              <div className="h-6 w-6 bg-white/10 rounded-md" />
            </div>
          </div>
          
          <div className="flex-1 p-8 md:p-12 flex flex-col gap-6 relative">
            <div className="h-6 w-2/3 bg-white/20 rounded-full mb-4" />
            <div className="space-y-4">
              <div className="h-3 w-full bg-white/10 rounded-full" />
              <div className="h-3 w-[95%] bg-white/10 rounded-full" />
              <div className="h-3 w-full bg-white/10 rounded-full" />
              <div className="h-3 w-[80%] bg-white/10 rounded-full" />
            </div>
            {/* Highlighted text */}
            <div className="relative mt-4">
              <div className="absolute -inset-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30" />
              <div className="relative h-3 w-[85%] bg-white/30 rounded-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-4 hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
                  <Highlighter className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-4 mt-6">
              <div className="h-3 w-[90%] bg-white/10 rounded-full" />
              <div className="h-3 w-[70%] bg-white/10 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Layer 2: AI Chat Assistant (Right floating) */}
        <motion.div 
          initial={{ opacity: 0, x: 60, y: 40 }}
          whileInView={{ opacity: 1, x: "20%", y: "20%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="absolute right-[5%] md:right-[15%] top-20 w-[280px] md:w-[320px] h-[380px] md:h-[450px] bg-[#1a2138]/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-indigo-500/10 flex flex-col overflow-hidden"
        >
          <div className="h-14 border-b border-white/10 bg-white/5 flex items-center px-5 gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="h-3 w-24 bg-white/30 rounded-full" />
          </div>
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
            <div className="self-end w-[85%] bg-indigo-600 p-3 rounded-2xl rounded-tr-sm">
              <div className="h-2 w-full bg-white/40 rounded-full mb-2" />
              <div className="h-2 w-3/4 bg-white/40 rounded-full" />
            </div>
            <div className="self-start w-[85%] bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-sm">
              <div className="h-2 w-full bg-white/30 rounded-full mb-2" />
              <div className="h-2 w-full bg-white/30 rounded-full mb-2" />
              <div className="h-2 w-4/5 bg-white/30 rounded-full" />
            </div>
            <div className="self-end w-[70%] bg-indigo-600 p-3 rounded-2xl rounded-tr-sm">
              <div className="h-2 w-full bg-white/40 rounded-full" />
            </div>
          </div>
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="h-10 w-full bg-white/5 border border-white/10 rounded-full flex items-center px-4">
              <div className="h-2 w-1/3 bg-white/20 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Layer 3: Flashcard preview (Left floating) */}
        <motion.div 
          initial={{ opacity: 0, x: -60, y: 60 }}
          whileInView={{ opacity: 1, x: "-20%", y: "40%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="absolute left-[5%] md:left-[15%] top-32 md:top-48 w-[260px] md:w-[300px] bg-[#1a2138]/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-purple-500/10 p-6 flex flex-col items-center text-center"
        >
          <div className="w-full flex justify-between items-center mb-6">
            <div className="h-2 w-16 bg-white/20 rounded-full" />
            <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <div className="h-4 w-[90%] bg-white/30 rounded-full mb-3" />
          <div className="h-4 w-[60%] bg-white/30 rounded-full mb-8" />
          <div className="w-full h-10 bg-indigo-500 rounded-xl flex items-center justify-center mt-2">
            <div className="h-3 w-20 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
