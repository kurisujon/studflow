"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { UploadCloud, Cpu, Sparkles, BookOpen, Layers, BarChart3 } = Lucide as any;

export function HowItWorksSection() {
  const steps = [
    { title: "Upload Your Material", icon: UploadCloud },
    { title: "AI Understands Your Document", icon: Cpu },
    { title: "Generate Summary & Study Resources", icon: Sparkles },
    { title: "Read With AI Assistance", icon: BookOpen },
    { title: "Practice With Flashcards & Quizzes", icon: Layers },
    { title: "Track Your Learning Progress", icon: BarChart3 }
  ];

  return (
    <section id="how-it-works" className="w-full py-24 bg-[#171717] border-y border-white/5 flex flex-col items-center">
      <div className="w-full max-w-4xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F9FAFB] tracking-tight">
            How Studflow Works
          </h2>
          <p className="text-[#A1A1AA] mt-4 text-lg">
            From raw document to complete mastery in six simple steps.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/5 md:left-1/2 md:-ml-[1px]" />

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative flex items-center gap-6 md:gap-0 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Node */}
                <div className="absolute left-8 md:left-1/2 -ml-6 w-12 h-12 rounded-full bg-[#1F1F1F] border-4 border-[#171717] shadow-xl flex items-center justify-center z-10">
                  <step.icon className="w-5 h-5 text-[#2563EB]" />
                </div>

                {/* Content */}
                <div className={`pl-20 md:pl-0 md:w-1/2 ${idx % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                  <div className="bg-[#1F1F1F] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
                    <div className="text-sm font-bold text-[#8B5CF6] mb-1">Step {idx + 1}</div>
                    <h3 className="text-xl font-semibold text-[#F9FAFB]">{step.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
