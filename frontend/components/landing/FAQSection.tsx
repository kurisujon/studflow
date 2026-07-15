"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import * as Lucide from "lucide-react";
const { Plus, Minus } = Lucide as unknown as Record<string, React.ElementType>;

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
    <section id="faq" className="w-full pt-[160px] pb-[120px] bg-[#050816] flex flex-col items-center relative overflow-hidden border-t border-[rgba(255,255,255,.05)]">
      <div className="absolute inset-0 bg-gradient-to-t from-[#050816] to-transparent pointer-events-none" />

      <div className="w-full max-w-[1000px] px-6 md:px-12 mx-auto relative z-10">
        <div className="text-center mb-[80px]">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[48px] font-bold text-white mb-6 tracking-tight leading-[1.2]"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[18px] text-white/60 leading-[1.6]"
          >
            Everything you need to know about Studflow.
          </motion.p>
        </div>

        <div className="flex flex-col">
          {faqs.map((faq, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className="border-b border-[rgba(255,255,255,.08)]"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full py-6 flex items-center justify-between text-left focus:outline-none hover:text-[#4F7BFF] transition-colors group"
              >
                <span className="font-semibold text-white/90 group-hover:text-white transition-colors text-[18px]">{faq.question}</span>
                <div className="w-8 h-8 rounded-full border border-[rgba(255,255,255,.1)] flex items-center justify-center bg-[rgba(255,255,255,.02)] group-hover:bg-[#4F7BFF]/10 group-hover:border-[#4F7BFF]/30 transition-all flex-shrink-0">
                  {openIndex === idx ? (
                    <Minus className="w-4 h-4 text-[#4F7BFF]" />
                  ) : (
                    <Plus className="w-4 h-4 text-white/50 group-hover:text-[#4F7BFF]" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="pb-8 pr-12 text-white/60 leading-[1.6] font-light text-[16px]">
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
