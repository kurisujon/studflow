"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { Quote } = Lucide as unknown as Record<string, React.ElementType>;

export function TestimonialSection() {
  const testimonials = [
    {
      quote: "Studflow has completely changed how I handle meetings. I no longer worry about missing details, and it quickly turns calls, lectures, and videos into clear, searchable notes. It's fast, accurate, and makes studying or work so much easier.",
      author: "M.J.",
      role: "Project Manager"
    },
    {
      quote: "I love using Studflow for my online classes. Uploading a lecture video and getting a neat, summarized note takes just minutes. It helps me focus during class without stressing about writing everything down.",
      author: "S.L.",
      role: "Student"
    },
    {
      quote: "Studflow saves me hours every week. I record client calls, get instant transcripts, and can review key points without replaying the entire meeting. It's simple, free, and works across all my devices.",
      author: "R.K.",
      role: "Sales Executive"
    },
    {
      quote: "Using Studflow for webinar summaries is amazing. I can capture main ideas, action items, and important quotes automatically. It's a must-have tool for remote teams and online learning.",
      author: "T.P.",
      role: "Marketing Specialist"
    },
    {
      quote: "Studflow is the easiest way to turn PDFs and video content into notes. I don't need to type or copy anything, and the AI summaries are spot on. It really improves productivity for work and study.",
      author: "L.C.",
      role: "Research Analyst"
    },
    {
      quote: "I rely on Studflow every day for meetings and interviews. The auto transcription and note generation help me stay organized and focused. Plus, it's free and fast, which makes life much easier.",
      author: "D.N.",
      role: "Entrepreneur"
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
              <p className="text-foreground mb-8 leading-relaxed relative z-10 text-lg">&quot;{t.quote}&quot;</p>
              <div>
                <div className="font-semibold text-foreground">{t.author}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
