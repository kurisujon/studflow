"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
// We cast Lucide to any to bypass the missing export types in lucide-react 0.x
const { XCircle, CheckCircle2 } = Lucide as unknown as Record<string, React.ElementType>;

export function ComparisonSection() {
  const traditionalMethods = [
    "Manual notes",
    "Long reading sessions",
    "Searching explanations",
    "No feedback"
  ];

  const studflowMethods = [
    "AI assistance",
    "Instant understanding",
    "Personal tutor",
    "Active recall"
  ];

  return (
    <section className="w-full py-24 bg-card flex flex-col items-center">
      <div className="w-full max-w-5xl px-4 sm:px-6 mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-4"
          >
            Why Studflow
          </motion.h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upgrade your study sessions from outdated methods to intelligent learning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 relative">
          {/* Traditional Way */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-background border border-border p-8 rounded-2xl relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-destructive/10 text-destructive px-4 py-1 rounded-full text-sm font-semibold border border-destructive/20">
              Traditional Studying
            </div>
            <ul className="space-y-6 mt-6">
              {traditionalMethods.map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 text-muted-foreground">
                  <XCircle className="w-6 h-6 text-destructive/50 flex-shrink-0" />
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* VS Badge */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-card border border-border rounded-full items-center justify-center font-bold text-muted-foreground z-10 shadow-sm">
            VS
          </div>

          {/* Studflow Way */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-primary/5 border-2 border-primary/20 p-8 rounded-2xl relative shadow-[0_0_40px_rgba(59,130,246,0.1)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-6 py-1 rounded-full text-sm font-bold shadow-md">
              With Studflow
            </div>
            <ul className="space-y-6 mt-6">
              {studflowMethods.map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 text-foreground font-medium">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
