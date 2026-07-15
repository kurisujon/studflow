"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import * as Lucide from "lucide-react";
const { ChevronDown } = Lucide as unknown as Record<string, React.ElementType>;

export function FAQSection() {
  const faqs = [
    {
      question: "What documents can I upload?",
      answer: "Studflow supports a wide variety of formats including PDFs, lecture slides (PPTX), Word documents, and text files. We also support extracting text directly from YouTube links and web articles."
    },
    {
      question: "How does Studflow understand my files?",
      answer: "We use advanced large language models combined with vector search to process your documents. The AI breaks down the content into concepts, builds a knowledge graph, and uses that context to provide accurate answers and summaries."
    },
    {
      question: "Can AI answer from my documents?",
      answer: "Yes! Every answer from the AI Tutor is directly grounded in the materials you uploaded. It acts as a personalized tutor that knows exactly what you're studying, rather than giving generic internet answers."
    },
    {
      question: "Can I create quizzes automatically?",
      answer: "Absolutely. Once a document is processed, Studflow can instantly generate multiple-choice quizzes, flashcards, and short-answer questions tailored to test your understanding of the material."
    },
    {
      question: "Are my notes saved?",
      answer: "Yes, all your notes, highlights, and generated study materials are securely saved to your personal dashboard. You can organize them by subject and access them across all your devices."
    },
    {
      question: "Is my data private?",
      answer: "We take your privacy seriously. Your uploaded documents are only used to generate your personal study materials. We do not sell your data or use your personal files to train public AI models."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="w-full py-32 bg-[#0a0e1a] flex flex-col items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] to-transparent pointer-events-none" />

      <div className="w-full max-w-3xl px-4 sm:px-6 mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/60 font-light"
          >
            Everything you need to know about Studflow.
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-white/[0.04] transition-colors"
              >
                <span className="font-semibold text-white/90 text-lg">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-indigo-400 transition-transform duration-300 flex-shrink-0 ${openIndex === idx ? "rotate-180" : ""}`} 
                />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 text-white/60 leading-relaxed font-light text-base md:text-lg">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
