"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { PlayCircle } = Lucide as unknown as Record<string, React.ElementType>;

export function ProductDemoSection() {
  return (
    <section id="demo" className="w-full py-24 bg-[#F8FAFC] flex flex-col items-center">
      <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10 lg:px-12 relative z-10 flex flex-col items-center pb-20 text-center">
        <h2 
          className="font-black text-[#0F172A] tracking-tight mb-6"
          style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)", lineHeight: "1.1" }}
        >
          See Studflow In Action
        </h2>
        <p className="text-[#475569] text-lg max-w-2xl mx-auto mb-16">
          Watch how we transform a standard PDF into a fully interactive, AI-assisted study session in seconds.
        </p>

        {/* Video Placeholder Container */}
        <div className="relative w-full max-w-5xl aspect-video bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_60px_rgba(79,70,229,0.06)] overflow-hidden group cursor-pointer flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border border-slate-200 z-10 shadow-[0_20px_60px_rgba(79,70,229,0.06)]"
          >
            <PlayCircle className="w-10 h-10 text-[#0F172A] ml-1" />
          </motion.div>

          <div className="absolute bottom-6 left-6 text-left z-10">
            <h4 className="text-[#0F172A] font-semibold text-lg">Interactive Walkthrough</h4>
            <p className="text-[#475569] text-sm">Upload → Read → Highlight → Practice</p>
          </div>
        </div>
      </div>
    </section>
  );
}
