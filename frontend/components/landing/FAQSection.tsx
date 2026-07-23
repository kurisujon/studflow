"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// @ts-expect-error - lucide-react types are outdated in this project
import { ChevronDown, HelpCircle } from "lucide-react";
import { LandingSection } from "./ui/LandingSection";
import { LandingContainer } from "./ui/LandingContainer";
import { LandingHeading } from "./ui/LandingHeading";
import { LandingBadge } from "./ui/LandingBadge";
import { LandingCard } from "./ui/LandingCard";

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
    <LandingSection id="faq" background="gradient" spacing="xl">
      <LandingContainer variant="narrow" className="flex flex-col items-center">
        <LandingHeading
          level={2}
          badge={
            <LandingBadge variant="neutral" icon={<HelpCircle className="w-4 h-4 text-[#64748B]" />}>
              Support & Answers
            </LandingBadge>
          }
          subtitle="Got questions? We've got answers."
        >
          Frequently Asked Questions
        </LandingHeading>

        <div className="space-y-4 w-full">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <LandingCard
                key={idx}
                variant="default"
                padding="none"
                radius="xl"
                hoverEffect={false}
                className={`transition-all duration-300 ${
                  isOpen ? "shadow-[0_20px_40px_rgba(15,23,42,0.06)] border-[#168BFF]/40" : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
              >
                <button
                  onClick={() => toggleOpen(idx)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#168BFF]/50"
                >
                  <span className="text-[1.125rem] md:text-[1.25rem] font-semibold text-[#0F172A]">
                    {faq.question}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ml-4 ${isOpen ? "bg-[#F0F7FF] text-[#168BFF]" : "bg-[#F8FAFC] text-[#64748B]"}`}>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#168BFF]" : "text-[#475569]"}`} 
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
                      <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 text-[#475569] text-base md:text-lg leading-relaxed border-t border-[#F1F5F9] pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </LandingCard>
            );
          })}
        </div>
      </LandingContainer>
    </LandingSection>
  );
}
