"use client";

import { motion } from "framer-motion";
import Link from "next/link";
// @ts-expect-error - lucide-react types are outdated in this project
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="w-full py-16 lg:py-24 bg-white relative overflow-hidden flex flex-col items-center">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ background: "radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.03), transparent 60%), radial-gradient(circle at 50% 100%, rgba(22, 139, 255, 0.04), transparent 50%)" }} />
      
      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-16 relative z-10 mx-auto flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[1000px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[32px] p-10 md:p-20 text-center flex flex-col items-center shadow-[0_20px_60px_rgba(79,70,229,0.06)] relative overflow-hidden group"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0F7FF] border border-[#168BFF]/20 mb-8 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-[#168BFF]" />
            <span className="text-[13px] font-bold text-[#168BFF] tracking-wide uppercase">Join thousands of smart students</span>
          </motion.div>

          <h2 
            className="font-black tracking-tight text-[#0F172A] mb-6 max-w-[800px]"
            style={{ fontSize: "clamp(2.5rem, 4vw, 3.75rem)", lineHeight: "1.1" }}
          >
            Start Building Better <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7BFF] to-[#7C5CFF]">
              Study Habits Today
            </span>
          </h2>

          <p 
            className="text-[#475569] max-w-[600px] mb-12 leading-[1.7]"
            style={{ fontSize: "clamp(1.05rem, 1.3vw, 1.15rem)" }}
          >
            Your personal AI study desk is waiting. Transform your documents into intelligent learning experiences in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto z-10">
            <Link
              href="/sign-up"
              className="group relative flex shrink-0 items-center justify-center gap-2 w-full sm:w-fit h-12 px-8 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-[#5964FF] to-[#8640FF] shadow-[0_8px_16px_-6px_rgba(89,100,255,0.4)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-6px_rgba(89,100,255,0.6)] hover:border-[#8640FF]/30 border border-transparent overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              Start Learning Free
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5 shrink-0" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
