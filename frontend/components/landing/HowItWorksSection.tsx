"use client";

import { motion } from "framer-motion";
// @ts-ignore
import { UploadCloud, Cpu, Target } from "lucide-react";

const steps = [
  {
    title: "Upload your material",
    description: "Drag and drop your PDF or DOCX file. Lecture slides, textbook chapters, or personal notes—StudFlow handles it all.",
    icon: UploadCloud,
    color: "text-[#168BFF]",
    bgColor: "bg-[#F0F7FF]",
    borderColor: "border-[#168BFF]/20"
  },
  {
    title: "Let AI process it",
    description: "Our document AI reads, extracts, and understands the core concepts, generating a complete study pack in seconds.",
    icon: Cpu,
    color: "text-[#7C3AED]",
    bgColor: "bg-[#F5F3FF]",
    borderColor: "border-[#7C3AED]/20"
  },
  {
    title: "Study actively",
    description: "Review summaries, flip flashcards, and test yourself with adaptive quizzes. Retain more information in less time.",
    icon: Target,
    color: "text-[#4F46E5]",
    bgColor: "bg-[#EEEDFC]",
    borderColor: "border-[#4F46E5]/20"
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-24 bg-[#F8FAFC]">
      <div className="w-full px-5 md:px-12 lg:px-24 mx-auto max-w-[1440px]">
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-tight mb-4">
            From document to mastery in <span className="text-[#4F46E5]">3 steps</span>
          </h2>
          <p className="text-lg text-[#64748B]">
            Stop spending hours preparing study materials. Let StudFlow do the heavy lifting so you can focus on learning.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#168BFF]/20 via-[#4F46E5]/20 to-[#7C3AED]/20 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                {/* Step Number Badge */}
                <div className={`w-24 h-24 rounded-full ${step.bgColor} border-4 border-white shadow-xl flex items-center justify-center mb-6 relative transition-transform duration-300 group-hover:-translate-y-2`}>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center font-bold text-[#0F172A]">
                    {idx + 1}
                  </div>
                  <step.icon className={`w-10 h-10 ${step.color}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-[#0F172A] mb-3">
                  {step.title}
                </h3>
                
                <p className="text-[#64748B] leading-relaxed max-w-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
