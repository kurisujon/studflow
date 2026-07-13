"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as Lucide from "lucide-react";
const { ArrowRight, Sparkles } = Lucide as unknown as Record<string, React.ElementType>;

export function CTASection() {
  return (
    <section className="w-full py-32 bg-primary relative overflow-hidden flex flex-col items-center">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />
      
      <div className="w-full max-w-4xl px-6 relative z-10 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white border border-white/30 mb-8 font-medium text-sm backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>Join thousands of smart students</span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight"
        >
          Start Building Better Study Habits Today
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-primary-foreground/80 text-xl max-w-2xl mb-12"
        >
          Your personal AI study desk is waiting. Transform your documents into intelligent learning experiences in seconds.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/sign-up"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-primary rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl hover:-translate-y-1"
          >
            Start Learning
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-white border border-white/20 rounded-xl font-bold text-lg transition-all flex items-center justify-center backdrop-blur-sm"
          >
            Explore Studflow
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
