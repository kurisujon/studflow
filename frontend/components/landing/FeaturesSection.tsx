"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { FileText, Bot, Layers, CircleHelp, Search, CheckCircle2 } = Lucide as unknown as Record<string, React.ElementType>;

export function FeaturesSection() {
  const features = [
    {
      title: "AI Document Understanding",
      description: "Upload any learning material and let our AI extract the core concepts into simple, readable summaries.",
      benefits: ["Save reading time", "Understand key concepts quickly", "Focus on important information"],
      icon: FileText,
      mockupType: "summary"
    },
    {
      title: "Interactive Study Reader",
      description: "Highlight text to save notes or instantly ask the AI for deeper explanations without leaving the page.",
      benefits: ["Learn without switching applications", "Keep context while studying"],
      icon: Search,
      mockupType: "reader"
    },
    {
      title: "Personal AI Tutor",
      description: "Stuck on a concept? Chat directly with an AI tutor that understands the exact document you're reading.",
      benefits: ["Personalized tutoring", "Clear explanations", "Better understanding"],
      icon: Bot,
      mockupType: "tutor"
    },
    {
      title: "Smart Flashcards",
      description: "Automatically generate digital flashcards from your study materials to master active recall.",
      benefits: ["Active recall", "Better memory retention"],
      icon: Layers,
      mockupType: "flashcards"
    },
    {
      title: "AI Generated Quizzes",
      description: "Test your understanding through automatically generated quizzes tailored to your reading.",
      benefits: ["Measure progress", "Practice knowledge"],
      icon: CircleHelp,
      mockupType: "quizzes"
    }
  ];

  return (
    <section id="features" className="w-full py-24 bg-background overflow-hidden relative">
      <div className="w-full max-w-7xl px-4 sm:px-6 flex flex-col items-center mb-16 mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight text-center">
          Experience Intelligent Learning
        </h2>
      </div>

      <div className="w-full max-w-7xl px-4 sm:px-6 space-y-32 mx-auto">
        {features.map((feature, idx) => (
          <div key={idx} className={`flex flex-col ${idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-24`}>
            
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: idx % 2 === 1 ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex-1 w-full"
            >
              <div className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center mb-6 shadow-sm">
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
              <div className="relative w-full min-h-[350px] lg:min-h-[450px] bg-card border border-border rounded-[16px] overflow-hidden shadow-2xl flex items-center justify-center p-8">
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
  if (type === "summary") {
    return (
      <div className="w-full h-full flex flex-col gap-4">
        <motion.div 
          animate={{ y: [10, 0, 10] }} 
          transition={{ duration: 4, repeat: Infinity }}
          className="w-full h-12 bg-muted rounded-md flex items-center px-4"
        >
          <div className="w-24 h-2 bg-muted-foreground/30 rounded-full" />
        </motion.div>
        <div className="flex-1 flex gap-4">
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }} 
            transition={{ duration: 3, repeat: Infinity }}
            className="flex-1 bg-muted rounded-md p-4 space-y-3"
          >
            <div className="w-full h-2 bg-muted-foreground/20 rounded-full" />
            <div className="w-5/6 h-2 bg-muted-foreground/20 rounded-full" />
            <div className="w-4/6 h-2 bg-muted-foreground/20 rounded-full" />
          </motion.div>
          <motion.div 
            initial={{ height: "0%" }}
            animate={{ height: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-1 bg-primary/30 rounded-full"
          />
          <div className="w-1/3 bg-primary/10 rounded-md border border-primary/20 p-4 space-y-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-primary/40 rounded-full" />
              <div className="w-4/5 h-2 bg-primary/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "reader") {
    return (
      <div className="w-full h-full flex gap-4">
        <div className="flex-1 bg-muted rounded-md p-6 space-y-4 relative">
          <div className="w-3/4 h-4 bg-muted-foreground/20 rounded-full mb-8" />
          <div className="space-y-2 relative">
            <div className="w-full h-2 bg-muted-foreground/20 rounded-full" />
            <motion.div 
              animate={{ width: ["0%", "100%", "100%", "0%"] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-0 left-0 h-2 bg-accent/40 rounded-full" 
            />
            <div className="w-full h-2 bg-muted-foreground/20 rounded-full mt-2" />
          </div>
          
          <motion.div 
            animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface shadow-xl border border-border p-3 rounded-lg z-10 w-48"
          >
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-accent" />
              <div className="h-2 w-16 bg-accent/40 rounded-full" />
            </div>
            <div className="h-2 w-full bg-muted-foreground/20 rounded-full" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (type === "tutor") {
    return (
      <div className="w-full h-full flex flex-col gap-4">
        <div className="flex-1 overflow-hidden space-y-4 pr-4">
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm max-w-[80%]">
              <div className="w-24 h-2 bg-primary-foreground/30 rounded-full mb-2" />
              <div className="w-32 h-2 bg-primary-foreground/30 rounded-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted border border-border p-3 rounded-2xl rounded-tl-sm w-full">
              <motion.div 
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 bg-muted-foreground/30 rounded-full mb-2" 
              />
              <motion.div 
                animate={{ width: ["0%", "80%"] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                className="h-2 bg-muted-foreground/30 rounded-full mb-2" 
              />
            </div>
          </div>
        </div>
        <div className="h-12 bg-muted border border-border rounded-full flex items-center px-4 mt-auto">
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-4 bg-primary rounded-full" 
          />
        </div>
      </div>
    );
  }

  if (type === "flashcards") {
    return (
      <div className="w-full h-full flex items-center justify-center relative perspective-[1000px]">
        <motion.div 
          animate={{ rotateY: [0, 180, 180, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-56 h-72 preserve-3d"
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-card border border-primary/20 rounded-xl shadow-xl p-6 flex flex-col z-10">
            <div className="w-full flex justify-between items-center mb-6">
              <div className="w-12 h-2 bg-primary/30 rounded-full" />
              <Layers className="w-5 h-5 text-primary/50" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-3/4 h-4 bg-foreground/20 rounded-full" />
              <div className="w-1/2 h-4 bg-foreground/20 rounded-full" />
            </div>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-primary/5 border border-primary/30 rounded-xl shadow-xl p-6 flex flex-col items-center justify-center text-center rotate-y-180">
            <div className="w-full h-3 bg-primary/40 rounded-full mb-3" />
            <div className="w-5/6 h-3 bg-primary/40 rounded-full mb-6" />
            <div className="w-full flex justify-center gap-2 mt-auto">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 text-xs">✗</div>
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 text-xs">✓</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (type === "quizzes") {
    return (
      <div className="w-full h-full flex flex-col justify-center gap-6">
        <div className="space-y-3 mb-4">
          <div className="w-5/6 h-3 bg-foreground/30 rounded-full" />
          <div className="w-4/6 h-3 bg-foreground/30 rounded-full" />
        </div>
        
        <div className="space-y-3">
          <div className="w-full h-12 bg-muted rounded-lg border border-border flex items-center px-4 gap-4">
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            <div className="w-1/2 h-2 bg-muted-foreground/30 rounded-full" />
          </div>
          <motion.div 
            animate={{ backgroundColor: ["rgba(59,130,246,0)", "rgba(59,130,246,0.1)"], borderColor: ["#1E293B", "#3B82F6"] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="w-full h-12 rounded-lg border flex items-center px-4 gap-4 relative overflow-hidden"
          >
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
            </div>
            <div className="w-3/4 h-2 bg-primary/50 rounded-full" />
            <motion.div 
               animate={{ opacity: [0, 1] }}
               transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
               className="absolute right-4 text-green-500 text-sm font-bold"
            >
              +10
            </motion.div>
          </motion.div>
          <div className="w-full h-12 bg-muted rounded-lg border border-border flex items-center px-4 gap-4">
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            <div className="w-2/3 h-2 bg-muted-foreground/30 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
