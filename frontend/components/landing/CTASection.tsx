"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as Lucide from "lucide-react";
const { ArrowRight } = Lucide as any;

export function CTASection() {
  return (
    <section className="w-full py-24 md:py-32 bg-[#0A0A0A] flex flex-col items-center relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#2563EB]/20 rounded-[100%] blur-[100px] pointer-events-none" />

      <div className="w-full max-w-4xl px-6 text-center z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-[#F9FAFB] tracking-tight mb-6"
        >
          Start Learning Smarter Today
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-[#A1A1AA] mb-10 max-w-2xl mx-auto"
        >
          Join thousands of students and professionals who have upgraded their study workflow with Studflow.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/sign-up"
            className="w-full sm:w-auto px-8 py-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-[12px] font-semibold text-base transition-colors flex items-center justify-center gap-2"
          >
            Start Studying <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-[#1F1F1F] hover:bg-[#171717] text-[#F9FAFB] border border-white/10 rounded-[12px] font-semibold text-base transition-colors"
          >
            Explore Features
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
