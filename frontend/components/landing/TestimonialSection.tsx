"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { Quote, Star } = Lucide as unknown as Record<string, React.ElementType>;

export function TestimonialSection() {
  const testimonials = [
    {
      name: "Sarah M.",
      role: "Medical Student at Johns Hopkins",
      text: "Studflow helped me understand complicated lecture materials faster. The active recall flashcards alone saved me hours of prep time. It feels like magic.",
      avatar: "S"
    },
    {
      name: "James T.",
      role: "CS Major at Stanford",
      text: "I upload research papers and use the AI tutor to explain complex algorithms. It's like having a dedicated teaching assistant available 24/7.",
      avatar: "J"
    },
    {
      name: "Elena R.",
      role: "Law Student at Harvard",
      text: "The ability to ask questions grounded directly in my case studies ensures I'm not getting hallucinations, just pure factual analysis. Invaluable.",
      avatar: "E"
    }
  ];

  return (
    <section id="reviews" className="w-full py-32 bg-[#0a0e1a] flex flex-col items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-900/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-7xl px-4 sm:px-6 mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6"
          >
            Loved by Students Everywhere
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto"
          >
            Join thousands of students who have already upgraded their study workflow.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 relative group hover:bg-white/10 transition-colors"
            >
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-indigo-400 text-indigo-400" />
                ))}
              </div>
              <Quote className="w-10 h-10 text-white/5 absolute top-8 right-8 group-hover:text-indigo-500/10 transition-colors" />
              <p className="text-white/80 mb-8 leading-relaxed text-lg font-light">&quot;{t.text}&quot;</p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-sm text-white/50">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
