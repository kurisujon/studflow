"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as Lucide from "lucide-react";
const { ArrowRight, Sparkles } = Lucide as unknown as Record<string, React.ElementType>;

export function CTASection() {
  return (
    <section className="w-full py-[120px] bg-[#050816] relative overflow-hidden flex flex-col items-center isolate">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#4F7BFF]/10 blur-[150px] rounded-full" />
      </div>
      
      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-20 relative z-10 mx-auto flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[1000px] bg-[rgba(16,20,38,.65)] border border-[rgba(255,255,255,.08)] rounded-[32px] p-10 md:p-20 text-center flex flex-col items-center shadow-[0_20px_80px_rgba(0,0,0,.4)] backdrop-blur-[24px] relative overflow-hidden group"
        >
          {/* Inner Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#4F7BFF]/10 blur-[80px] rounded-full group-hover:opacity-70 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7C5CFF]/10 blur-[80px] rounded-full group-hover:opacity-70 transition-opacity duration-700" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,255,255,.05)] text-white border border-[rgba(255,255,255,.1)] mb-8 font-medium text-[14px]"
          >
            <Sparkles className="w-4 h-4 text-[#4F7BFF]" />
            <span>Join thousands of smart students</span>
          </motion.div>

          <h2 className="text-[48px] md:text-[64px] font-bold text-white mb-6 tracking-tight max-w-[800px] leading-[1.1]">
            Start Building Better Study Habits Today
          </h2>

          <p className="text-white/60 text-[18px] max-w-[600px] mb-[40px] leading-[1.6]">
            Your personal AI study desk is waiting. Transform your documents into intelligent learning experiences in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto z-10">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#4F7BFF] to-[#7C5CFF] text-white rounded-full font-semibold text-[16px] transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(79,123,255,0.25)] hover:shadow-[0_0_60px_rgba(79,123,255,0.4)] hover:-translate-y-1 whitespace-nowrap"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
