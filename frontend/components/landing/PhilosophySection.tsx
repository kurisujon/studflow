"use client";

import { motion } from "framer-motion";

export function PhilosophySection() {
  return (
    <section className="w-full py-32 bg-background flex flex-col items-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2563EB]/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-4xl px-6 text-center z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-8"
        >
          Study smarter, not longer.
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed mb-12"
        >
          Studflow is built on a simple philosophy: combine powerful <span className="text-foreground font-medium">AI assistance</span> with proven <span className="text-foreground font-medium">active recall</span> to create a truly <span className="text-foreground font-medium">personalized learning</span> experience.
        </motion.p>
      </div>
    </section>
  );
}
