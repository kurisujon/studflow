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
    <section id="how-it-works" className="w-full py-[120px] bg-[#050816] relative overflow-hidden flex flex-col items-center border-t border-[rgba(255,255,255,.05)]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-64 bg-[#4F7BFF]/10 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-20 mx-auto z-10">
        <div className="text-center mb-[80px]">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[48px] font-bold text-white mb-6 tracking-tight leading-[1.2]"
          >
            How Studflow Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[18px] text-white/60 max-w-[700px] mx-auto leading-[1.6]"
          >
            A seamless pipeline from raw material to total mastery.
          </motion.p>
        </div>

        {/* Horizontal Workflow for Desktop, wrapping for Mobile */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-6 lg:gap-3 py-8">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.15, ease: "easeOut" }}
              className="flex items-center"
            >
              {/* Step Node */}
              <div className="group relative flex flex-col items-center justify-center p-6 w-32 md:w-36 bg-[rgba(16,20,38,.65)] border border-[rgba(255,255,255,.08)] rounded-2xl backdrop-blur-[20px] hover:bg-[rgba(16,20,38,.85)] transition-all cursor-default hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,.25),0_0_30px_rgba(79,123,255,.1)] duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-[#4F7BFF]/20 to-[#7C5CFF]/20 border border-[#4F7BFF]/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="w-5 h-5 text-[#4F7BFF]" />
                </div>
                <span className="text-[14px] font-semibold text-white/80 text-center leading-[1.4]">
                  {step.title}
                </span>
                
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-[#4F7BFF]/0 group-hover:bg-[#4F7BFF]/[0.02] rounded-2xl transition-colors" />
              </div>

              {/* Arrow Connector (hide on last item) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center w-10 text-white/10 px-2">
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
