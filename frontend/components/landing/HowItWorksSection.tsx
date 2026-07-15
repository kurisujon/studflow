"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";

const { 
  Upload, 
  BrainCircuit, 
  FileText, 
  MessageSquare, 
  Highlighter, 
  Layers, 
  CircleHelp,
  ArrowRight
} = Lucide as unknown as Record<string, React.ElementType>;

export function HowItWorksSection() {
  const steps = [
    { title: "Upload PDF", icon: Upload },
    { title: "AI Reads", icon: BrainCircuit },
    { title: "Summary", icon: FileText },
    { title: "Ask AI", icon: MessageSquare },
    { title: "Highlights", icon: Highlighter },
    { title: "Flashcards", icon: Layers },
    { title: "Take Quiz", icon: CircleHelp },
  ];

  return (
    <section id="how-it-works" className="w-full py-24 bg-[#0a0e1a] relative overflow-hidden flex flex-col items-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-64 bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="w-full max-w-7xl px-4 sm:px-6 mx-auto z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight"
          >
            How Studflow Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            A seamless pipeline from raw material to total mastery.
          </motion.p>
        </div>

        {/* Horizontal Workflow for Desktop, wrapping for Mobile */}
        <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-2">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="flex items-center"
            >
              {/* Step Node */}
              <div className="group relative flex flex-col items-center justify-center p-4 w-28 md:w-32 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/20 duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <step.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-white/80 text-center leading-tight">
                  {step.title}
                </span>
                
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-indigo-400/0 group-hover:bg-indigo-400/5 rounded-2xl transition-colors" />
              </div>

              {/* Arrow Connector (hide on last item) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center w-8 text-white/20 px-1">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
