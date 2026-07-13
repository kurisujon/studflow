"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { PlayCircle } = Lucide as unknown as Record<string, React.ElementType>;

export function ProductDemoSection() {
  return (
    <section id="demo" className="w-full py-24 bg-[#0A0A0A] flex flex-col items-center">
      <div className="w-full max-w-6xl px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-[#F9FAFB] tracking-tight mb-6">
          See Studflow In Action
        </h2>
        <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto mb-16">
          Watch how we transform a standard PDF into a fully interactive, AI-assisted study session in seconds.
        </p>

        {/* Video Placeholder Container */}
        <div className="relative w-full aspect-video bg-[#171717] rounded-2xl border border-white/10 shadow-2xl overflow-hidden group cursor-pointer flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#2563EB]/10 to-[#8B5CF6]/10 opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 z-10 shadow-xl"
          >
            <PlayCircle className="w-10 h-10 text-[#F9FAFB] ml-1" />
          </motion.div>

          <div className="absolute bottom-6 left-6 text-left z-10">
            <h4 className="text-[#F9FAFB] font-semibold text-lg">Interactive Walkthrough</h4>
            <p className="text-[#A1A1AA] text-sm">Upload → Read → Highlight → Practice</p>
          </div>
        </div>
      </div>
    </section>
  );
}
