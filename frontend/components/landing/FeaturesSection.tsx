"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
// @ts-expect-error - lucide-react types are outdated in this project
import { FileText, Layers, CheckCircle, Edit3, MessageSquare, Video, Sparkles, RotateCcw } from "lucide-react";

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
      {/* Counter */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#64748B]">
          Card {cardIndex + 1} of {sampleCards.length}
        </span>
        <div className="flex items-center gap-1.5">
          <RotateCcw className="w-3 h-3 text-[#94A3B8]" />
          <span className="text-xs text-[#94A3B8]">{flipped ? "Answer" : "Question"}</span>
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 min-h-[88px] flex items-center gap-3"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-xs text-[#64748B]">Generating next card…</span>
          </motion.div>
        ) : (
          <motion.div
            key={`${cardIndex}-${flipped ? "back" : "front"}`}
            initial={{ opacity: 0, rotateY: flipped ? -15 : 15, scale: 0.97 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className={`rounded-xl border p-4 min-h-[88px] flex flex-col justify-center ${
              flipped
                ? "border-[#4F46E5]/30 bg-gradient-to-br from-[#EEEDFC] to-white"
                : "border-[#E2E8F0] bg-white"
            }`}
          >
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${flipped ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}>
              {flipped ? "Answer" : "Question"}
            </p>
            <p className="text-sm font-medium text-[#0F172A] leading-snug">
              {flipped ? card.a : card.q}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {sampleCards.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${i === cardIndex ? "w-4 bg-[#4F46E5]" : "w-1.5 bg-[#E2E8F0]"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Variants ─────────────────────────────────────────────────────────────────
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const headingVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

// ── Standard feature card ─────────────────────────────────────────────────────
function FeatureCard({ feature }: { feature: typeof standardFeatures[0] }) {
  const Icon = feature.icon;
  return (
    <motion.div
      variants={cardVariants}
      className={`group relative flex flex-col rounded-[24px] bg-white border border-[#E2E8F0] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[6px] hover:shadow-xl ${feature.borderGlow} cursor-default`}
      style={{ padding: "32px" }}
    >
      {/* Top gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${feature.accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Icon */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center mb-6 shrink-0 shadow-sm transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3`}>
        <Icon className={`w-7 h-7 ${feature.color}`} />
      </div>

      {/* Label */}
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${feature.labelColor} ${feature.labelBg} px-2.5 py-1 rounded-full mb-3 w-fit`}>
        {feature.label}
      </span>

      {/* Title */}
      <h3 className="text-lg font-bold text-[#0F172A] mb-3 leading-snug group-hover:text-[#168BFF] transition-colors duration-300">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-[#475569] leading-[1.7] flex-grow">
        {feature.description}
      </p>
    </motion.div>
  );
}

// ── Featured card (Smart Flashcards, spans 2 cols) ────────────────────────────
function FeaturedFlashcardCard() {
  return (
    <motion.div
      variants={cardVariants}
      className="group relative flex flex-col rounded-[24px] border border-[#4F46E5]/20 overflow-hidden md:col-span-2 lg:col-span-1 xl:col-span-2 cursor-default hover:-translate-y-[6px] transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-[#4F46E5]/10"
      style={{
        padding: "32px",
        background: "linear-gradient(135deg, #fafaff 0%, #f4f3ff 50%, #fafaff 100%)",
      }}
    >
      {/* Top gradient bar — always visible on featured */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#168BFF]" />

      {/* Most Popular badge */}
      <div className="absolute top-6 right-6">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-3 py-1.5 rounded-full shadow-md shadow-[#4F46E5]/30">
          ⚡ Most Popular
        </span>
      </div>

      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#EEEDFC] to-[#E0DEFF] flex items-center justify-center mb-6 shrink-0 shadow-sm transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3">
        <Layers className="w-7 h-7 text-[#4F46E5]" />
      </div>

      {/* Label */}
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#4F46E5] bg-[#EEEDFC] px-2.5 py-1 rounded-full mb-3 w-fit">
        Spaced Repetition
      </span>

      {/* Title + description */}
      <h3 className="text-lg font-bold text-[#0F172A] mb-3 leading-snug group-hover:text-[#4F46E5] transition-colors duration-300">
        Smart Flashcards
      </h3>
      <p className="text-sm text-[#475569] leading-[1.7] mb-2">
        Automatically generate active-recall flashcards from your documents, complete with Spaced Repetition to ensure long-term retention.
      </p>

      {/* Live flashcard preview */}
      <FlashcardPreview />
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function FeaturesSection() {
  return (
    <section id="features" className="landing-section w-full bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-b from-[#168BFF]/6 to-transparent blur-[100px]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-[#7C3AED]/6 to-transparent blur-[90px]" />
        {/* Faint dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, #64748B 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="landing-container relative z-10">
        {/* ── Section heading ── */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#168BFF]" />
            <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">AI-Powered Learning Tools</span>
          </div>

          <h2
            className="font-bold text-[#0F172A] tracking-tight mb-5 leading-tight"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.75rem)" }}
          >
            Everything You Need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#168BFF] via-[#4F46E5] to-[#7C3AED]">
              Ace Every Exam
            </span>
          </h2>

          <p className="text-[#475569] leading-[1.7]" style={{ fontSize: "clamp(1rem, 1.8vw, 1.1rem)" }}>
            Transform your study materials into summaries, flashcards, quizzes, and more with a complete AI-powered learning workspace.
          </p>
        </motion.div>

        {/* ── Feature Grid ── */}
        <motion.div
          className="grid gap-5 lg:gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* First two standard cards */}
          {standardFeatures.slice(0, 2).map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}

          {/* Featured Smart Flashcards card — spans 2 cols on md+ */}
          <FeaturedFlashcardCard />

          {/* Remaining standard cards */}
          {standardFeatures.slice(2).map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
