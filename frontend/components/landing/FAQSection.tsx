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
    <section id="faq" className="w-full py-24 bg-[#F8FAFC]">
      <div className="w-full px-5 md:px-12 lg:px-24 mx-auto max-w-[800px]">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-[#64748B]">
            Got questions? We&apos;ve got answers.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                className={`border border-[#E2E8F0] rounded-2xl overflow-hidden transition-colors duration-300 ${
                  isOpen ? "bg-white shadow-md border-[#168BFF]/30" : "bg-[#F8FAFC] hover:bg-white"
                }`}
              >
                <button
                  onClick={() => toggleOpen(idx)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#168BFF]"
                >
                  <span className={`text-lg font-semibold transition-colors ${isOpen ? "text-[#168BFF]" : "text-[#0F172A]"}`}>
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? "bg-[#F0F7FF]" : "bg-[#F8FAFC]"}`}>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#168BFF]" : "text-[#64748B]"}`} 
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
                      <div className="p-6 pt-0 text-[#64748B] leading-relaxed">
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
