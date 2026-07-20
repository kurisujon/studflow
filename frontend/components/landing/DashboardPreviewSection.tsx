"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";

const { 
  LayoutDashboard, 
  Layers, 
  Bot,
  Highlighter
} = Lucide as unknown as Record<string, React.ElementType>;

export function DashboardPreviewSection() {
  return (
    <section className="w-full py-[120px] bg-[#050816] flex flex-col items-center overflow-hidden relative border-t border-[rgba(255,255,255,.05)] isolate">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#4F7BFF]/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-20 text-center mb-[80px] relative z-10 mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(79,123,255,0.1)] border border-[rgba(79,123,255,0.2)] text-[#4F7BFF] text-sm font-medium mb-6"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Unified Workspace</span>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[48px] font-bold text-white mb-6 tracking-tight leading-[1.2]"
        >
          Everything in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7BFF] to-[#7C5CFF]">one place.</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-[18px] text-white/60 max-w-[700px] mx-auto leading-[1.6]"
        >
          Your entire study ecosystem—reading, notes, AI tutoring, flashcards, and quizzes—beautifully integrated into a single distraction-free interface.
        </motion.p>
      </div>

      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-20 mx-auto relative z-10 h-[600px] md:h-[800px] flex justify-center">
        {/* Layer 1: Main PDF/Summary Reader (Back/Center) */}
        <motion.div 
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-0 w-[95%] md:w-[75%] h-[400px] md:h-[600px] bg-[#0E1326] border border-[rgba(255,255,255,.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,.4)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="h-14 border-b border-[rgba(255,255,255,.05)] bg-[rgba(255,255,255,.01)] flex items-center px-6 justify-between">
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
              <div className="absolute -inset-2 bg-[#4F7BFF]/10 rounded-lg border border-[#4F7BFF]/20" />
              <div className="relative h-3 w-[85%] bg-white/30 rounded-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-4 hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#4F7BFF] shadow-[0_0_20px_rgba(79,123,255,.4)] flex items-center justify-center">
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
          initial={{ opacity: 0, x: 40, y: 40 }}
          whileInView={{ opacity: 1, x: "15%", y: "20%" }}
          viewport={{ once: true }}
          animate={{ y: ["20%", "22%", "20%"] }}
          transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.8, delay: 0.2 }, x: { duration: 0.8, delay: 0.2, ease: "easeOut" } }}
          className="absolute right-[5%] md:right-[15%] top-20 w-[280px] md:w-[320px] h-[380px] md:h-[450px] bg-[rgba(16,20,38,.85)] backdrop-blur-[24px] border border-[rgba(255,255,255,.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,.4),0_0_30px_rgba(79,123,255,.08)] flex flex-col overflow-hidden"
        >
          <div className="h-14 border-b border-[rgba(255,255,255,.05)] bg-[rgba(255,255,255,.02)] flex items-center px-5 gap-3">
            <div className="w-8 h-8 bg-[#4F7BFF]/20 rounded-full flex items-center justify-center border border-[#4F7BFF]/30">
              <Bot className="w-4 h-4 text-[#4F7BFF]" />
            </div>
            <div className="h-3 w-24 bg-white/30 rounded-full" />
          </div>
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
            <div className="self-end w-[85%] bg-[#4F7BFF] p-3 rounded-2xl rounded-tr-sm">
              <div className="h-2 w-full bg-white/40 rounded-full mb-2" />
              <div className="h-2 w-3/4 bg-white/40 rounded-full" />
            </div>
            <div className="self-start w-[85%] bg-white/5 border border-[rgba(255,255,255,.05)] p-3 rounded-2xl rounded-tl-sm">
              <div className="h-2 w-full bg-white/30 rounded-full mb-2" />
              <div className="h-2 w-full bg-white/30 rounded-full mb-2" />
              <div className="h-2 w-4/5 bg-white/30 rounded-full" />
            </div>
            <div className="self-end w-[70%] bg-[#4F7BFF] p-3 rounded-2xl rounded-tr-sm">
              <div className="h-2 w-full bg-white/40 rounded-full" />
            </div>
          </div>
          <div className="p-4 border-t border-[rgba(255,255,255,.05)] bg-[rgba(255,255,255,.01)]">
            <div className="h-10 w-full bg-white/5 border border-[rgba(255,255,255,.05)] rounded-full flex items-center px-4">
              <div className="h-2 w-1/3 bg-white/20 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Layer 3: Flashcard preview (Left floating) */}
        <motion.div 
          initial={{ opacity: 0, x: -40, y: 60 }}
          whileInView={{ opacity: 1, x: "-15%", y: "40%" }}
          viewport={{ once: true }}
          animate={{ y: ["40%", "38%", "40%"] }}
          transition={{ y: { duration: 5, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.8, delay: 0.4 }, x: { duration: 0.8, delay: 0.4, ease: "easeOut" } }}
          className="absolute left-[5%] md:left-[15%] top-32 md:top-48 w-[260px] md:w-[300px] bg-[rgba(16,20,38,.85)] backdrop-blur-[24px] border border-[rgba(255,255,255,.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,.4),0_0_30px_rgba(124,92,255,.08)] p-6 flex flex-col items-center text-center"
        >
          <div className="w-full flex justify-between items-center mb-6">
            <div className="h-2 w-16 bg-white/20 rounded-full" />
            <Layers className="w-5 h-5 text-[#7C5CFF]" />
          </div>
          <div className="h-4 w-[90%] bg-white/30 rounded-full mb-3" />
          <div className="h-4 w-[60%] bg-white/30 rounded-full mb-8" />
          <div className="w-full h-10 bg-[#7C5CFF] rounded-xl flex items-center justify-center mt-2 shadow-[0_0_20px_rgba(124,92,255,.3)]">
            <div className="h-3 w-20 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
