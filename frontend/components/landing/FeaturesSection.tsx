"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { FileText, Bot, Highlighter, Layers, CircleHelp, Search, CheckCircle2 } = Lucide as unknown as Record<string, React.ElementType>;

export function FeaturesSection() {
  const features = [
    {
      title: "AI-Powered Document Summary",
      description: "Convert complex documents into simple explanations.",
      benefits: ["Save reading time", "Understand key concepts quickly", "Focus on important information"],
      icon: FileText
    },
    {
      title: "Interactive AI Study Reader",
      description: "Read documents with AI assistance directly inside the learning workspace.",
      benefits: ["Learn without switching applications", "Keep context while studying"],
      icon: Search
    },
    {
      title: "Contextual AI Tutor",
      description: "Ask questions and receive answers grounded in your uploaded documents.",
      benefits: ["Personalized tutoring", "Clear explanations", "Better understanding"],
      icon: Bot
    },
    {
      title: "Smart Notes & Highlights",
      description: "Save important concepts while reading.",
      benefits: ["Never lose important information", "Quickly revisit concepts"],
      icon: Highlighter
    },
    {
      title: "Interactive Flashcards",
      description: "Automatically generate flashcards from learning materials.",
      benefits: ["Active recall", "Better memory retention"],
      icon: Layers
    },
    {
      title: "AI Generated Quizzes",
      description: "Test understanding through automatically generated quizzes.",
      benefits: ["Measure progress", "Practice knowledge"],
      icon: CircleHelp
    }
  ];

  return (
    <section id="features" className="w-full py-24 bg-background border-t border-border relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Everything You Need to Master Any Subject</h2>
          <p className="text-lg text-muted-foreground">
            A complete suite of AI-powered tools designed to improve how you read, remember, and review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-card border border-border p-8 rounded-2xl hover:border-primary/50 transition-colors shadow-sm flex flex-col"
            >
              <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                {feature.description}
              </p>
              
              <ul className="space-y-2 mt-auto">
                {feature.benefits.map((benefit, bIdx) => (
                  <li key={bIdx} className="flex items-center gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
