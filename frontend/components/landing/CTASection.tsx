"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="w-full py-24 md:py-32 bg-background flex flex-col items-center relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 rounded-[100%] blur-[100px] pointer-events-none" />

      <div className="w-full max-w-4xl px-6 text-center z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Start Using Studflow Today
          </h2>
          <p className="text-lg text-muted-foreground">
            Turn your meetings, videos, and PDFs into clear, organized notes in seconds. Studflow helps you capture ideas, summarize content, and stay on top of tasks instantly. No sign-up needed, just start creating notes now.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/sign-up"
            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[12px] font-semibold text-base transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            Try It Free Now
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-muted hover:bg-card text-foreground border border-border rounded-[12px] font-semibold text-base transition-colors"
          >
            Explore Features
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
