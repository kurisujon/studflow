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
    <section className="w-full py-24 bg-[#ffffff] flex flex-col items-center">
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16 relative z-10 flex flex-col items-center pb-20 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-black text-[#0F172A] mb-16"
          style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)", lineHeight: "1.1" }}
        >
          Studying Should Not Feel Overwhelming
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16 w-full max-w-4xl">
          {problems.map((problem, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white border border-rose-100 p-6 rounded-[24px] flex items-center gap-4 shadow-[0_20px_60px_rgba(79,70,229,0.06)]"
            >
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-lg font-medium text-[#475569]">{problem}</span>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5]"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xl font-bold">Studflow helps you learn with confidence.</span>
        </motion.div>
      </div>
    </section>
  );
}
