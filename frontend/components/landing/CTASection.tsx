"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as Lucide from "lucide-react";
const { ArrowRight, Sparkles } = Lucide as unknown as Record<string, React.ElementType>;

export function CTASection() {
  return (
    <section className="w-full py-32 bg-[#0a0e1a] relative overflow-hidden flex flex-col items-center">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-[100px] rounded-full" />
      </div>
      
      <div className="w-full max-w-5xl px-4 sm:px-6 relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/[0.02] border border-white/10 rounded-3xl p-10 md:p-16 text-center flex flex-col items-center shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          {/* Inner Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white border border-white/10 mb-8 font-medium text-sm backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Join thousands of smart students</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight max-w-2xl">
            Start Building Better Study Habits Today
          </h2>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mb-10 font-light">
            Your personal AI study desk is waiting. Transform your documents into intelligent learning experiences in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto z-10">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] hover:-translate-y-1"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
