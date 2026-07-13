"use client";

import { motion } from "framer-motion";
import { FileText, Bot, Highlighter, Layers, CircleHelp, LayoutDashboard, Search, CheckCircle2 } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      title: "AI-Powered Document Summary",
      description: "Convert complex documents into simple explanations.",
      benefits: ["Save reading time", "Understand key concepts quickly", "Focus on important information"],
      icon: FileText,
      mockupType: "summary"
    },
    {
      title: "Interactive AI Study Reader",
      description: "Read documents with AI assistance directly inside the learning workspace.",
      benefits: ["Learn without switching applications", "Keep context while studying"],
      icon: Search,
      mockupType: "reader"
    },
    {
      title: "Contextual AI Tutor",
      description: "Ask questions and receive answers grounded in your uploaded documents.",
      benefits: ["Personalized tutoring", "Clear explanations", "Better understanding"],
      icon: Bot,
      mockupType: "tutor"
    },
    {
      title: "Smart Notes & Highlights",
      description: "Save important concepts while reading.",
      benefits: ["Never lose important information", "Quickly revisit concepts"],
      icon: Highlighter,
      mockupType: "notes"
    },
    {
      title: "Interactive Flashcards",
      description: "Automatically generate flashcards from learning materials.",
      benefits: ["Active recall", "Better memory retention"],
      icon: Layers,
      mockupType: "flashcards"
    },
    {
      title: "AI Generated Quizzes",
      description: "Test understanding through automatically generated quizzes.",
      benefits: ["Measure progress", "Practice knowledge"],
      icon: CircleHelp,
      mockupType: "quizzes"
    },
    {
      title: "Learning Dashboard",
      description: "Manage documents, notes, quizzes, and study progress.",
      benefits: ["Track recent documents", "Monitor progress", "Review sessions"],
      icon: LayoutDashboard,
      mockupType: "dashboard"
    }
  ];

  return (
    <section id="features" className="w-full py-24 bg-background flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-7xl px-6 flex flex-col items-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight text-center">
          Everything You Need to Master Any Subject
        </h2>
        <p className="text-muted-foreground text-lg mt-4 max-w-2xl text-center">
          A complete suite of AI-powered tools designed to improve how you read, remember, and review.
        </p>
      </div>

      <div className="w-full max-w-7xl px-6 space-y-32">
        {features.map((feature, idx) => (
          <div key={idx} className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 lg:gap-24`}>
            
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: idx % 2 === 1 ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex-1 w-full"
            >
              <div className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{feature.title}</h3>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{feature.description}</p>
              
              <ul className="space-y-3">
                {feature.benefits.map((benefit, bIdx) => (
                  <li key={bIdx} className="flex items-center gap-3 text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Mockup Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="flex-1 w-full"
            >
              <div className="relative aspect-square md:aspect-[4/3] w-full bg-card border border-border rounded-[16px] overflow-hidden shadow-2xl flex items-center justify-center p-8">
                {/* Abstract visualization based on mockupType */}
                <FeatureMockup type={feature.mockupType} />
              </div>
            </motion.div>

          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureMockup({ type }: { type: string }) {
  // Return different abstract visual mockups based on feature type
  if (type === "summary") {
    return (
      <div className="w-full h-full flex flex-col gap-4">
        <div className="h-6 w-1/3 bg-foreground/10 rounded mb-2" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-foreground/10 rounded" />
          <div className="h-3 w-full bg-foreground/10 rounded" />
          <div className="h-3 w-3/4 bg-foreground/10 rounded" />
        </div>
        <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-[12px]">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-primary" />
            <div className="h-3 w-20 bg-primary/40 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-foreground/10 rounded" />
            <div className="h-2 w-5/6 bg-foreground/10 rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  if (type === "flashcards") {
    return (
      <div className="relative w-full max-w-sm aspect-[4/3]">
        <motion.div 
          animate={{ rotate: [-2, 2, -2], zIndex: [10, 0, 10] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-muted border border-border rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center text-center origin-bottom"
        >
          <div className="h-4 w-3/4 bg-foreground/10 rounded mb-2" />
          <div className="h-4 w-1/2 bg-foreground/10 rounded" />
          <div className="mt-8 px-4 py-2 bg-foreground/10 rounded-full text-xs text-muted-foreground">Tap to flip</div>
        </motion.div>
        <motion.div 
          animate={{ rotate: [3, -3, 3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          className="absolute inset-0 bg-card border border-border rounded-2xl shadow-lg -z-10"
        />
      </div>
    );
  }

  // Generic fallback for others
  return (
    <div className="w-full h-full border border-border bg-muted rounded-xl flex flex-col p-4 opacity-70">
      <div className="h-4 w-24 bg-foreground/10 rounded mb-6" />
      <div className="flex-1 flex gap-4">
        <div className="w-16 h-full bg-foreground/10 rounded-lg" />
        <div className="flex-1 space-y-4">
          <div className="h-20 w-full bg-foreground/10 rounded-lg" />
          <div className="h-20 w-full bg-foreground/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
