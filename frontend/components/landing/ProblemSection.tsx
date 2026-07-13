"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { XCircle, CheckCircle2 } = Lucide as unknown as Record<string, React.ElementType>;

export function ProblemSection() {
  const problems = [
    "I don't know where to start",
    "I forget what I read",
    "I spend hours making notes",
    "I struggle understanding concepts"
  ];

  return (
    <section className="w-full py-24 bg-background flex flex-col items-center">
      <div className="w-full max-w-4xl px-6 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-foreground mb-16"
        >
          Studying Should Not Feel Overwhelming
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {problems.map((problem, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card border border-destructive/20 p-6 rounded-2xl flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <span className="text-lg font-medium text-muted-foreground">{problem}</span>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xl font-bold">Studflow helps you learn with confidence.</span>
        </motion.div>
      </div>
    </section>
  );
}
