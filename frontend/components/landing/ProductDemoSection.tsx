"use client";

import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";

export function ProductDemoSection() {
  return (
    <section id="demo" className="w-full py-24 bg-background flex flex-col items-center">
      <div className="w-full max-w-6xl px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
          See Studflow In Action
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
          Watch how we transform a standard PDF into a fully interactive, AI-assisted study session in seconds.
        </p>

        {/* Video Placeholder Container */}
        <div className="relative w-full aspect-video bg-card rounded-2xl border border-border shadow-2xl overflow-hidden group cursor-pointer flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 bg-foreground/10 backdrop-blur-md rounded-full flex items-center justify-center border border-border z-10 shadow-xl"
          >
            <PlayCircle className="w-10 h-10 text-foreground ml-1" />
          </motion.div>

          <div className="absolute bottom-6 left-6 text-left z-10">
            <h4 className="text-foreground font-semibold text-lg">Interactive Walkthrough</h4>
            <p className="text-muted-foreground text-sm">Upload → Read → Highlight → Practice</p>
          </div>
        </div>
      </div>
    </section>
  );
}
