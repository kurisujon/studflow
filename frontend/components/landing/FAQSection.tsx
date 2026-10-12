"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
    answer: "StudFlow currently accepts PDF and DOCX files through the upload workflow."
  },
  {
    question: "How does the AI generate summaries and flashcards?",
    answer: "After upload, asynchronous processing extracts and chunks the document before generating its structured summary, flashcards, and document-based multiple-choice quiz."
  },
  {
    question: "Can I ask questions about my document?",
    answer: "Yes. Ask AI retrieves relevant chunks from the selected document. When verified evidence supports a response, StudFlow includes source citations; otherwise it shows an insufficient-evidence or out-of-scope state."
  },
  {
    question: "How is access to my documents handled?",
    answer: "StudFlow requires an authenticated account for the document workspace and applies the platform's existing ownership controls. Review the deployed service's approved privacy information before uploading sensitive material."
  },
  {
    question: "Do you have a spaced repetition system (SRS)?",
    answer: "Yes. During Daily Review, your Again, Hard, Good, or Easy rating updates that card's interval and next review date."
  }
];

export function FAQSection() {
  const reduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <LandingSection id="faq" background="gradient" spacing="lg">
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
            const triggerId = `faq-trigger-${idx}`;
            const panelId = `faq-panel-${idx}`;
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
                  type="button"
                  id={triggerId}
                  onClick={() => toggleOpen(idx)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
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
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.3 }}
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
