"use client";

import { motion } from "framer-motion";

export function PhilosophySection() {
  return (
    <section className="w-full py-32 bg-[#F8FAFC] flex flex-col items-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent pointer-events-none" />
      
      <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10 lg:px-12 relative z-10 flex flex-col pb-20 text-center items-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-black text-[#0F172A] tracking-tight mb-8"
          style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)", lineHeight: "1.1" }}
        >
          Study smarter, not longer.
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-[#475569] font-light leading-relaxed mb-12 max-w-4xl"
        >
          Studflow is built on a simple philosophy: combine powerful <span className="text-[#0F172A] font-medium">AI assistance</span> with proven <span className="text-[#0F172A] font-medium">active recall</span> to create a truly <span className="text-[#0F172A] font-medium">personalized learning</span> experience.
        </motion.p>
      </div>
    </section>
  );
}
