"use client";

import { motion } from "framer-motion";
// @ts-expect-error - lucide-react types are outdated in this project
import { FileText, Layers, CheckCircle, Edit3, MessageSquare, Video } from "lucide-react";

const features = [
  {
    title: "Concise Summaries",
    description: "Instantly distill long lectures and dense readings into easy-to-digest bullet points and key takeaways.",
    icon: FileText,
    color: "text-[#168BFF]",
    bgColor: "bg-[#F0F7FF]",
  },
  {
    title: "Smart Flashcards",
    description: "Automatically generate active-recall flashcards from your documents, complete with Spaced Repetition.",
    icon: Layers,
    color: "text-[#4F46E5]",
    bgColor: "bg-[#EEEDFC]",
  },
  {
    title: "Adaptive Quizzes",
    description: "Test your knowledge with AI-generated multiple-choice quizzes that adapt to your weakest topics.",
    icon: CheckCircle,
    color: "text-[#7C3AED]",
    bgColor: "bg-[#F5F3FF]",
  },
  {
    title: "Contextual Notes",
    description: "Highlight text and add inline notes directly inside your study workspace. Never lose your place.",
    icon: Edit3,
    color: "text-[#2563EB]",
    bgColor: "bg-[#EFF6FF]",
  },
  {
    title: "Ask Document AI",
    description: "Stuck on a concept? Ask the AI questions grounded directly in your uploaded file's text.",
    icon: MessageSquare,
    color: "text-[#168BFF]",
    bgColor: "bg-[#F0F7FF]",
  },
  {
    title: "Related Videos",
    description: "Automatically find YouTube lectures and tutorials that match the topics in your document.",
    icon: Video,
    color: "text-[#4F46E5]",
    bgColor: "bg-[#EEEDFC]",
  },
];

export function FeaturesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section id="features" className="w-full py-24 bg-white relative">
      <div className="w-full px-5 md:px-12 lg:px-24 mx-auto max-w-[1440px]">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-tight mb-4">
            Everything you need to <span className="text-[#168BFF]">ace your exams</span>
          </h2>
          <p className="text-lg text-[#64748B]">
            A complete suite of AI-powered study tools, designed specifically for students to maximize retention and minimize prep time.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={cardVariants}
              className="group p-8 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white hover:border-[#168BFF]/30 hover:shadow-xl hover:shadow-[#168BFF]/5 transition-all duration-300 relative overflow-hidden"
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              
              <h3 className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-[#168BFF] transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-[#64748B] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
        
      </div>
    </section>
  );
}
