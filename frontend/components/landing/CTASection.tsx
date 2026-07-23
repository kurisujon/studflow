"use client";

import { motion } from "framer-motion";
// @ts-expect-error - lucide-react types are outdated in this project
import { ArrowRight, Sparkles } from "lucide-react";
import { LandingSection } from "./ui/LandingSection";
import { LandingContainer } from "./ui/LandingContainer";
import { LandingBadge } from "./ui/LandingBadge";
import { LandingButton } from "./ui/LandingButton";
import { LandingCard } from "./ui/LandingCard";

export function CTASection() {
  return (
    <LandingSection background="card" spacing="lg" className="relative overflow-hidden">
      {/* Background Ambience */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.03), transparent 60%), radial-gradient(circle at 50% 100%, rgba(22, 139, 255, 0.04), transparent 50%)",
        }}
      />

      <LandingContainer variant="narrow" className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <LandingCard
            variant="muted"
            padding="lg"
            radius="2xl"
            hoverEffect={false}
            className="text-center flex flex-col items-center shadow-[0_20px_60px_rgba(79,70,229,0.06)] relative overflow-hidden"
          >
            <LandingBadge variant="primary" icon={<Sparkles className="w-4 h-4 text-[#168BFF]" />} className="mb-8">
              Your AI-powered study workflow
            </LandingBadge>

            <h2 className="font-black tracking-tight text-[#0F172A] mb-6 max-w-[800px] text-3xl sm:text-4xl lg:text-5xl leading-[1.1]">
              Start Building Better <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7BFF] to-[#7C5CFF]">
                Study Habits Today
              </span>
            </h2>

            <p className="text-[#475569] max-w-[600px] mb-10 text-base sm:text-lg leading-[1.7]">
              Your personal AI study desk is waiting. Transform your documents into intelligent learning experiences in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto z-10">
              <LandingButton
                href="/sign-up"
                variant="primary"
                size="lg"
                className="w-full sm:w-fit"
                icon={<ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5 shrink-0" />}
              >
                Start Learning Free
              </LandingButton>
            </div>
          </LandingCard>
        </motion.div>
      </LandingContainer>
    </LandingSection>
  );
}
