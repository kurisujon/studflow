"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// @ts-expect-error - lucide-react types are outdated in this project
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What file types do you support?",
    answer: "Currently, StudFlow supports PDF and DOCX files. We are actively working on adding support for PPT (PowerPoint) and TXT files in the near future."
  },
  {
    question: "How does the AI generate summaries and flashcards?",
    answer: "When you upload a document, our backend extracts the text and uses advanced AI models to identify the core concepts. It then structures this information into readable summaries, flashcards, and adaptive quizzes tailored to your specific material."
  },
  {
    question: "Can I ask questions about my document?",
    answer: "Yes! Our 'Ask AI' feature is grounded entirely in your uploaded document. It will read the specific chunks of text related to your question and provide answers complete with citations so you know exactly where the information came from."
  },
  {
    question: "Are my documents kept private?",
    answer: "Absolutely. Your uploaded files are stored securely and are only accessible by you. We do not use your personal study materials to train public AI models."
  },
  {
    question: "Do you have a spaced repetition system (SRS)?",
    answer: "Yes, our flashcard system uses a Spaced Repetition System. As you study, the algorithm learns which concepts you find difficult and schedules them for review more frequently to maximize your retention."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full py-24 md:py-32 bg-white relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC] to-white pointer-events-none" />
      <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10 lg:px-12 relative z-10 flex flex-col items-center pb-20">
        
        <div className="text-center mb-16 lg:mb-20 max-w-3xl">
          <h2 
            className="text-[#0F172A] font-black tracking-tight mb-6"
            style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)", lineHeight: "1.1" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-[#475569] text-[clamp(1.125rem,2vw,1.25rem)] mb-8">
            Got questions? We&apos;ve got answers.
          </p>
        </div>

        <div className="space-y-4 w-full max-w-4xl">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                className={`border rounded-[24px] md:rounded-[32px] overflow-hidden transition-all duration-300 ease-out bg-white ${
                  isOpen ? "shadow-[0_20px_60px_rgba(79,70,229,0.06)] border-[#E2E8F0]" : "border-[#E2E8F0]/60 hover:shadow-[0_20px_60px_rgba(79,70,229,0.06)] hover:border-[#E2E8F0]"
                }`}
              >
                <button
                  onClick={() => toggleOpen(idx)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                >
                  <span className="text-[1.125rem] md:text-[1.25rem] font-semibold text-[#0F172A]">
                    {faq.question}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ml-4 ${isOpen ? "bg-indigo-50" : "bg-[#F8FAFC]"}`}>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180 text-indigo-600" : "text-[#475569]"}`} 
                    />
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6 md:p-8 pt-0 md:pt-0 text-[#475569] text-base md:text-lg leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
