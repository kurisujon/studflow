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
      text: "I upload research papers and use the AI tutor to explain complex algorithms. It's like having a dedicated teaching assistant available 24/7. My grades have never been better.",
      avatar: "J"
    },
    {
      name: "Elena R.",
      role: "Law Student at Harvard",
      text: "The ability to ask questions grounded directly in my case studies ensures I'm not getting hallucinations, just pure factual analysis. Invaluable.",
      avatar: "E"
    },
    {
      name: "Michael K.",
      role: "History Undergrad",
      text: "I used to spend 4 hours a day just reading and taking notes. Now I get it done in half the time and remember way more.",
      avatar: "M"
    },
    {
      name: "Amanda L.",
      role: "High School Senior",
      text: "The quizzes are incredibly accurate to what actually shows up on my AP exams. I don't study without this anymore.",
      avatar: "A"
    },
    {
      name: "David W.",
      role: "Engineering Student",
      text: "Having all my notes, highlights, and AI explanations in one place instead of scattered across 5 apps is a game changer.",
      avatar: "D"
    }
  ];

  return (
    <section id="reviews" className="w-full py-[120px] bg-[#050816] flex flex-col items-center relative overflow-hidden border-t border-[rgba(255,255,255,.05)] isolate">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#4F7BFF]/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-20 mx-auto relative z-10">
        <div className="text-center mb-[80px]">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[48px] font-bold text-white tracking-tight mb-6 leading-[1.2]"
          >
            Loved by Students Everywhere
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[18px] text-white/60 max-w-[700px] mx-auto leading-[1.6]"
          >
            Join thousands of students who have already upgraded their study workflow.
          </motion.p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (idx % 3) * 0.1 }}
              className="bg-[rgba(16,20,38,.65)] backdrop-blur-[20px] p-6 rounded-2xl border border-[rgba(255,255,255,.08)] shadow-[0_20px_60px_rgba(0,0,0,.25)] relative group hover:bg-[rgba(16,20,38,.85)] transition-colors break-inside-avoid"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3.5 h-3.5 fill-[#4F7BFF] text-[#4F7BFF]" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-white/[0.03] absolute top-6 right-6 group-hover:text-[#4F7BFF]/10 transition-colors" />
              <p className="text-white/80 mb-6 leading-[1.6] text-[16px] font-light">&quot;{t.text}&quot;</p>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F7BFF] to-[#7C5CFF] flex items-center justify-center text-white font-bold text-sm shadow-inner">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white text-[15px]">{t.name}</div>
                  <div className="text-[13px] text-white/50">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
