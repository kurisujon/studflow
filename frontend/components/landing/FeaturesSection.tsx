"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { FileText, Bot, Sparkles, CheckCircle2 } = Lucide as unknown as Record<string, React.ElementType>;

export function FeaturesSection() {
  const features = [
    {
      title: "Smart Notes From Any Content",
      description: "Upload meetings, videos, PDFs, or audio files and turn them into organized notes automatically.",
      benefits: ["Support for PDF, Video & Audio", "Automatic organization", "Capture ideas instantly"],
      icon: FileText,
      mockupType: "notes"
    },
    {
      title: "Fast AI Summaries and Transcripts",
      description: "Generate clean summaries, key points, and transcripts in seconds to save time while studying or working.",
      benefits: ["High accuracy transcripts", "Concise summaries", "Time-saving workflows"],
      icon: Bot,
      mockupType: "summary"
    },
    {
      title: "Free Online AI Note Taker",
      description: "Use the AI note generator online for free with no downloads, complicated setup, or long sign-up steps.",
      benefits: ["No downloads required", "Free to use", "Works on any device"],
      icon: Sparkles,
      mockupType: "free"
    }
  ];

  return (
    <section id="features" className="w-full py-24 bg-background border-t border-border relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">What Makes Studflow Stand Out?</h2>
          <p className="text-lg text-muted-foreground">
            Studflow helps you capture ideas, organize information, and create clear notes from almost any type of content online in just a few clicks.
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
                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
                <FeatureMockup type={feature.mockupType} />
              </div>
            </motion.div>

          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

function FeatureMockup({ type }: { type: string }) {
  if (type === "summary") {
    return (
      <div className="w-full h-full flex flex-col gap-4">
        <div className="w-full h-8 bg-muted rounded-md flex items-center px-4">
          <div className="w-24 h-2 bg-muted-foreground/30 rounded-full" />
        </div>
        <div className="flex-1 flex gap-4">
          <div className="flex-1 bg-muted rounded-md p-4 space-y-3">
            <div className="w-full h-2 bg-muted-foreground/20 rounded-full" />
            <div className="w-5/6 h-2 bg-muted-foreground/20 rounded-full" />
            <div className="w-4/6 h-2 bg-muted-foreground/20 rounded-full" />
          </div>
          <div className="w-1/3 bg-primary/10 rounded-md border border-primary/20 p-4 space-y-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-primary/30 rounded-full" />
              <div className="w-4/5 h-2 bg-primary/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "notes") {
    return (
      <div className="w-full h-full flex flex-col gap-4">
        <div className="flex justify-between items-center w-full mb-2">
           <div className="w-32 h-4 bg-muted-foreground/20 rounded-full" />
           <div className="w-8 h-8 bg-primary/10 rounded-full border border-primary/20" />
        </div>
        <div className="w-full h-24 bg-muted rounded-md border-l-4 border-primary p-4">
           <div className="w-3/4 h-3 bg-primary/40 rounded-full mb-3" />
           <div className="w-full h-2 bg-muted-foreground/30 rounded-full mb-2" />
           <div className="w-5/6 h-2 bg-muted-foreground/30 rounded-full" />
        </div>
        <div className="w-full h-24 bg-muted rounded-md border-l-4 border-secondary p-4">
           <div className="w-1/2 h-3 bg-secondary/40 rounded-full mb-3" />
           <div className="w-full h-2 bg-muted-foreground/30 rounded-full mb-2" />
           <div className="w-4/5 h-2 bg-muted-foreground/30 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
      <div className="relative w-48 h-48 bg-card border border-primary/20 rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.15)] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center rotate-3 transition-transform hover:rotate-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div className="w-24 h-3 bg-primary/20 rounded-full" />
        <div className="w-16 h-2 bg-muted-foreground/20 rounded-full" />
      </div>
    </div>
  );
}
