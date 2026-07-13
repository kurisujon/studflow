"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { Quote } = Lucide as unknown as Record<string, React.ElementType>;

export function TestimonialSection() {
  const testimonials = [
    {
      name: "Sarah M.",
      role: "Medical Student",
      text: "Studflow helped me understand complicated lecture materials faster. The active recall flashcards alone saved me hours of prep time."
    },
    {
      name: "James T.",
      role: "Computer Science Major",
      text: "I upload research papers and use the AI tutor to explain complex algorithms. It's like having a TA available 24/7."
    },
    {
      name: "Elena R.",
      role: "Law Student",
      text: "The ability to ask questions grounded directly in my case studies ensures I'm not getting hallucinations, just pure factual analysis."
    }
  ];

  return (
    <section id="reviews" className="w-full py-24 bg-card border-y border-border flex flex-col items-center">
      <div className="w-full max-w-7xl px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-center mb-16">
          Loved by Students Everywhere
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-muted p-8 rounded-2xl border border-border relative"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-6 right-6" />
              <p className="text-foreground mb-8 leading-relaxed relative z-10 text-lg">&quot;{t.text}&quot;</p>
              <div>
                <div className="font-semibold text-foreground">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
