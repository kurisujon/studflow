"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
const { ChevronDown } = Lucide as any;

export function FAQSection() {
  const faqs = [
    {
      question: "What documents can I upload?",
      answer: "Studflow currently supports standard document formats including PDF, DOCX, and TXT files. We recommend uploading lecture slides, academic papers, and reading materials."
    },
    {
      question: "How does AI understand my files?",
      answer: "When you upload a document, our system analyzes the text, structure, and context. It creates a secure semantic index that allows our AI to accurately extract concepts, generate summaries, and answer your questions based strictly on that source material."
    },
    {
      question: "Can I ask questions about my documents?",
      answer: "Yes. Our Contextual AI Tutor lets you highlight specific passages or ask general questions. Every answer it provides is grounded in the material you uploaded, reducing hallucinations and ensuring accuracy."
    },
    {
      question: "Can Studflow generate quizzes?",
      answer: "Absolutely. Studflow can automatically generate multiple-choice and short-answer quizzes based on your document's key concepts, helping you test your understanding instantly."
    },
    {
      question: "Are my documents private?",
      answer: "Yes. Your uploaded documents are private to your account. We do not use your personal study materials to train public AI models."
    },
    {
      question: "Can I save notes and highlights?",
      answer: "Yes, you can highlight text directly in the interactive reader and attach personal notes. These are saved to your dashboard for easy review later."
    }
  ];

  return (
    <section className="w-full py-24 bg-[#0A0A0A] flex flex-col items-center">
      <div className="w-full max-w-3xl px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-[#F9FAFB] tracking-tight text-center mb-16">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#171717] border border-white/5 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
      >
        <span className="font-semibold text-[#F9FAFB]">{question}</span>
        <ChevronDown className={`w-5 h-5 text-[#A1A1AA] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 text-[#A1A1AA] leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
