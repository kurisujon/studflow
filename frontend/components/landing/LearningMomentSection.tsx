"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { FileText, Bot, Layers, CircleHelp, ArrowRight } = Lucide as unknown as Record<string, React.ElementType>;

export function LearningMomentSection() {
  const moments = [
    {
      title: "Open Document",
      description: "Start reading your lecture notes.",
      icon: FileText
    },
    {
      title: "AI Explains",
      description: "Get instant clarity on hard paragraphs.",
      icon: Bot
    },
    {
      title: "Create Flashcard",
      description: "Save the concept for active recall.",
      icon: Layers
    },
    {
      title: "Complete Quiz",
      description: "Test yourself and master the topic.",
      icon: CircleHelp
    }
  ];

  return (
    <section className="w-full py-24 bg-card border-y border-border flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-7xl px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-4"
          >
            The Perfect Learning Moment
          </motion.h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience a seamless transformation from confusion to complete understanding.
          </p>
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Background connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 rounded-full" />
          
          {moments.map((moment, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center w-full md:w-1/4 group"
            >
              <div className="w-20 h-20 bg-surface border border-border shadow-xl rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <moment.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">{moment.title}</h3>
              <p className="text-muted-foreground text-sm px-4">{moment.description}</p>
              
              {/* Arrow for mobile */}
              {idx < moments.length - 1 && (
                <div className="md:hidden my-6">
                  <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
