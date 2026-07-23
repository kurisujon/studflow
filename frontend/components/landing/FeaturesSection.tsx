"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { FileText, Layers, CheckCircle, Edit3, MessageSquare, Video, Sparkles, RotateCcw } from "lucide-react";
import { LandingSection } from "./ui/LandingSection";
import { LandingContainer } from "./ui/LandingContainer";
import { LandingHeading } from "./ui/LandingHeading";
import { LandingBadge } from "./ui/LandingBadge";
import { LandingCard } from "./ui/LandingCard";

// ── Feature definitions ──────────────────────────────────────────────────────
const standardFeatures = [
  {
    title: "Concise Summaries",
    description: "Instantly distill long lectures and dense readings into easy-to-digest bullet points and key takeaways — saving hours of re-reading.",
    icon: FileText,
    label: "AI Powered",
    labelColor: "text-[#168BFF]",
    labelBg: "bg-[#F0F7FF]",
    color: "text-[#168BFF]",
    iconBg: "from-[#EBF5FF] to-[#F0F7FF]",
    borderGlow: "hover:border-[#168BFF]/30 hover:shadow-[#168BFF]/8",
    accentGradient: "from-[#168BFF] to-[#4F46E5]",
  },
  {
    title: "Adaptive Quizzes",
    description: "Test your knowledge with AI-generated multiple-choice quizzes that adapt to your weakest topics and reinforce retention.",
    icon: CheckCircle,
    label: "Personalized",
    labelColor: "text-[#7C3AED]",
    labelBg: "bg-[#F5F3FF]",
    color: "text-[#7C3AED]",
    iconBg: "from-[#F0EBFF] to-[#F5F3FF]",
    borderGlow: "hover:border-[#7C3AED]/30 hover:shadow-[#7C3AED]/8",
    accentGradient: "from-[#7C3AED] to-[#4F46E5]",
  },
  {
    title: "Contextual Notes",
    description: "Highlight text and add inline notes directly inside your study workspace. Never lose your annotations or context again.",
    icon: Edit3,
    label: "Smart",
    labelColor: "text-[#2563EB]",
    labelBg: "bg-[#EFF6FF]",
    color: "text-[#2563EB]",
    iconBg: "from-[#EBF2FF] to-[#EFF6FF]",
    borderGlow: "hover:border-[#2563EB]/30 hover:shadow-[#2563EB]/8",
    accentGradient: "from-[#2563EB] to-[#168BFF]",
  },
  {
    title: "Ask Document AI",
    description: "Stuck on a concept? Ask questions grounded directly in your uploaded file's text for accurate, source-backed answers.",
    icon: MessageSquare,
    label: "Instant",
    labelColor: "text-[#168BFF]",
    labelBg: "bg-[#F0F7FF]",
    color: "text-[#168BFF]",
    iconBg: "from-[#EBF5FF] to-[#F0F7FF]",
    borderGlow: "hover:border-[#168BFF]/30 hover:shadow-[#168BFF]/8",
    accentGradient: "from-[#168BFF] to-[#7C3AED]",
  },
  {
    title: "Related Videos",
    description: "Automatically surface YouTube lectures and tutorials that match the exact topics in your uploaded document.",
    icon: Video,
    label: "Smart",
    labelColor: "text-[#4F46E5]",
    labelBg: "bg-[#EEEDFC]",
    color: "text-[#4F46E5]",
    iconBg: "from-[#EEEDFC] to-[#F0EDFF]",
    borderGlow: "hover:border-[#4F46E5]/30 hover:shadow-[#4F46E5]/8",
    accentGradient: "from-[#4F46E5] to-[#7C3AED]",
  },
];

// ── Flashcard flip preview for the featured card ─────────────────────────────
const sampleCards = [
  { q: "What is the Blood-Brain Barrier?", a: "A selective semi-permeable membrane that separates the blood from the brain's extracellular fluid, protecting neural tissue." },
  { q: "Define synaptic plasticity.", a: "The ability of synapses to strengthen or weaken over time in response to changes in neural activity." },
  { q: "What is action potential?", a: "A rapid electrical signal that travels along a neuron's axon when stimulated beyond a threshold." },
];

function FlashcardPreview() {
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const showFront = setTimeout(() => setFlipped(false), 0);
    const flip = setTimeout(() => setFlipped(true), 1800);
    const next = setTimeout(() => {
      setGenerating(true);
      setTimeout(() => {
        setCardIndex((i) => (i + 1) % sampleCards.length);
        setGenerating(false);
      }, 600);
    }, 3600);
    return () => { clearTimeout(showFront); clearTimeout(flip); clearTimeout(next); };
  }, [cardIndex]);

  const card = sampleCards[cardIndex];

  return (
    <div className="mt-6 select-none">
      <div className="relative h-[220px] sm:h-[200px] w-full [perspective:1000px]">
        <AnimatePresence mode="wait">
          {generating ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-6 text-center shadow-inner"
            >
              <RotateCcw className="w-6 h-6 text-[#7C3AED] animate-spin" />
              <span className="text-xs font-semibold text-[#64748B]">Generating next active recall card...</span>
            </motion.div>
          ) : (
            <motion.div
              key={cardIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full cursor-pointer"
              onClick={() => setFlipped((f) => !f)}
            >
              <div
                className={`relative w-full h-full rounded-2xl transition-all duration-500 [transform-style:preserve-3d] ${
                  flipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* Front (Question) */}
                <div className="absolute inset-0 rounded-2xl bg-white border border-[#E2E8F0] p-5 sm:p-6 flex flex-col justify-between [backface-visibility:hidden] shadow-sm hover:border-[#7C3AED]/40 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider bg-[#F5F3FF] px-2.5 py-1 rounded-full border border-[#7C3AED]/20">
                      Question · Card {cardIndex + 1} of 3
                    </span>
                    <span className="text-[11px] font-semibold text-[#94A3B8] flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Tap to flip
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug my-auto">
                    {card.q}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#94A3B8] pt-3 border-t border-[#F1F5F9]">
                    <span>Topic: Neuroscience</span>
                    <span>Spaced Repetition Active</span>
                  </div>
                </div>

                {/* Back (Answer) */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5964FF] text-white p-5 sm:p-6 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      Answer · Tap to flip back
                    </span>
                    <span className="text-[11px] font-semibold text-white/70">Verified by AI</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed my-auto text-white/95">
                    {card.a}
                  </p>
                  <div className="flex items-center gap-2 pt-3 border-t border-white/20 text-[11px] font-semibold text-white/80">
                    <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Rating: Good (Interval: +3 days)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Animation Variants ────────────────────────────────────────────────────────
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const headingVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

// ── Feature Card Component ────────────────────────────────────────────────────
function FeatureCard({ feature }: { feature: typeof standardFeatures[0] }) {
  const Icon = feature.icon;
  return (
    <motion.div variants={itemVariants} className="h-full">
      <LandingCard variant="default" padding="lg" radius="2xl" className="h-full flex flex-col justify-between group">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-gradient-to-br ${feature.iconBg} opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-40`} />

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center border border-[#E2E8F0] shadow-sm transition-transform duration-300 group-hover:scale-110`}>
              <Icon className={`w-6 h-6 ${feature.color}`} />
            </div>
            <span className={`text-[12px] font-bold px-3 py-1 rounded-full border ${feature.labelBg} ${feature.labelColor} border-current/20`}>
              {feature.label}
            </span>
          </div>

          <h3 className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-[#168BFF] transition-colors">
            {feature.title}
          </h3>

          <p className="text-sm text-[#64748B] leading-relaxed">
            {feature.description}
          </p>
        </div>

        <div className="mt-8 pt-4 border-t border-[#F1F5F9] flex items-center text-xs font-bold text-[#168BFF] group-hover:translate-x-1 transition-transform">
          <span>Explore Feature</span>
          <span className="ml-1">→</span>
        </div>
      </LandingCard>
    </motion.div>
  );
}

// ── Centerpiece Featured Card ─────────────────────────────────────────────────
function FeaturedFlashcardCard() {
  return (
    <motion.div variants={itemVariants}>
      <LandingCard variant="elevated" padding="lg" radius="2xl" className="relative overflow-hidden bg-gradient-to-br from-white via-[#F8FAFC] to-[#F5F3FF] border-2 border-[#7C3AED]/20 hover:border-[#7C3AED]/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#7C3AED]/10 via-[#5964FF]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F3FF] border border-[#7C3AED]/30 text-[#7C3AED] text-xs font-bold uppercase tracking-wider w-fit mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Core Feature · Spaced Repetition</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A] mb-4 tracking-tight leading-tight">
              Interactive Flashcards with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#5964FF]">Spaced Repetition</span>
            </h3>

            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed mb-6">
              Never forget what you study. StudFlow automatically extracts key terms from your documents, creates two-sided active recall cards, and schedules reviews using scientifically proven spaced repetition intervals.
            </p>

            <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#0F172A]">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#E2E8F0] shadow-sm">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                <span>SM-2 Memory Algorithm</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#E2E8F0] shadow-sm">
                <Layers className="w-4 h-4 text-[#7C3AED]" />
                <span>Auto-Generated from Documents</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <FlashcardPreview />
          </div>
        </div>
      </LandingCard>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function FeaturesSection() {
  return (
    <LandingSection id="features" background="card" spacing="lg">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-b from-[#168BFF]/6 to-transparent blur-[100px]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-[#7C3AED]/6 to-transparent blur-[90px]" />
      </div>

      <LandingContainer variant="default" className="relative z-10 flex flex-col">
        {/* Section heading */}
        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <LandingHeading
            level={2}
            badge={
              <LandingBadge variant="primary" icon={<Sparkles className="w-4 h-4 text-[#168BFF]" />}>
                AI-Powered Learning Tools
              </LandingBadge>
            }
            subtitle="Transform your study materials into summaries, flashcards, quizzes, and more with a complete AI-powered learning workspace designed for success."
          >
            Everything You Need to <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#168BFF] via-[#4F46E5] to-[#7C3AED]">
              Ace Every Exam
            </span>
          </LandingHeading>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* Featured Card */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <FeaturedFlashcardCard />
          </div>

          {/* Standard cards */}
          <div className="col-span-1">
            <FeatureCard feature={standardFeatures[0]} />
          </div>
          <div className="col-span-1">
            <FeatureCard feature={standardFeatures[1]} />
          </div>
          <div className="col-span-1">
            <FeatureCard feature={standardFeatures[2]} />
          </div>
          <div className="col-span-1 lg:col-start-2">
            <FeatureCard feature={standardFeatures[3]} />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <FeatureCard feature={standardFeatures[4]} />
          </div>
        </motion.div>
      </LandingContainer>
    </LandingSection>
  );
}
