"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { FileText, Highlighter, Bot, Layers, CircleHelp, LineChart } = Lucide as unknown as Record<string, React.ElementType>;

export function TrustSection() {
  const features = [
    {
      title: "AI Summary",
      description: "Understand information faster.",
      icon: FileText
    },
    {
      title: "Smart Notes",
      description: "Save important ideas.",
      icon: Highlighter
    },
    {
      title: "AI Tutor",
      description: "Ask questions anytime.",
      icon: Bot
    },
    {
      title: "Flashcards",
      description: "Remember concepts longer.",
      icon: Layers
    },
    {
      title: "Quizzes",
      description: "Test your knowledge.",
      icon: CircleHelp
    },
    {
      title: "Progress",
      description: "Track improvement.",
      icon: LineChart
    }
  ];

  return (
    <section className="w-full py-24 bg-card border-y border-border flex flex-col items-center">
      <div className="w-full max-w-7xl px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-4"
          >
            Everything You Need For Better Learning
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-surface border border-border p-6 rounded-2xl flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
