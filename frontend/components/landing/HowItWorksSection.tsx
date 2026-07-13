"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import * as Lucide from "lucide-react";
const { Upload, BrainCircuit, FileText, Bot, Trophy } = Lucide as unknown as Record<string, React.ElementType>;

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const steps = [
    {
      title: "Upload Materials",
      description: "Drop your PDFs, lecture slides, video links, or past notes securely into your workspace.",
      icon: Upload
    },
    {
      title: "AI Understands Your Content",
      description: "Our AI instantly reads, analyzes, and extracts the core concepts from your documents.",
      icon: BrainCircuit
    },
    {
      title: "Generate Study Resources",
      description: "Automatically create summaries, flashcards, and quizzes tailored to your material.",
      icon: FileText
    },
    {
      title: "Review & Practice",
      description: "Read with AI assistance, test your knowledge, and chat with your personal AI tutor.",
      icon: Bot
    },
    {
      title: "Master The Topic",
      description: "Track your progress, improve your retention, and ace your exams with confidence.",
      icon: Trophy
    }
  ];

  return (
    <section id="how-it-works" className="w-full py-24 bg-card border-y border-border flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-4xl px-6" ref={containerRef}>
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-6"
          >
            How Studflow Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            A simple, intuitive process that transforms the way you learn.
          </motion.p>
        </div>

        <div className="relative">
          {/* Vertical Line Background */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-border -translate-x-1/2 rounded-full" />
          
          {/* Animated Fill Line */}
          <motion.div 
            className="absolute left-8 md:left-1/2 top-0 w-1 bg-primary -translate-x-1/2 rounded-full origin-top"
            style={{ height: lineHeight }}
          />

          <div className="space-y-24">
            {steps.map((step, idx) => (
              <div key={idx} className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} relative z-10`}>
                
                {/* Text Content */}
                <motion.div 
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                  className={`flex-1 text-left ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'} pl-20 md:pl-0`}
                >
                  <h3 className="text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-lg">{step.description}</p>
                </motion.div>

                {/* Center Node */}
                <div className="absolute left-8 md:static md:left-auto flex-shrink-0 w-16 h-16 rounded-full bg-background border-4 border-card shadow-xl flex items-center justify-center -translate-x-1/2 md:translate-x-0 z-20">
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center relative group">
                    <step.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md">
                      0{idx + 1}
                    </div>
                  </div>
                </div>

                {/* Empty Space for Alignment */}
                <div className="hidden md:block flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
