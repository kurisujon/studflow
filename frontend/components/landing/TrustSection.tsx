"use client";

import { motion, Variants } from "framer-motion";
import * as Lucide from "lucide-react";
const { GraduationCap, FlaskConical, Briefcase, UserRound } = Lucide as unknown as Record<string, React.ElementType>;

export function TrustSection() {
  const cards = [
    {
      title: "Students",
      description: "Understand lectures and textbooks faster.",
      icon: GraduationCap,
      color: "#2563EB"
    },
    {
      title: "Researchers",
      description: "Extract important information from documents.",
      icon: FlaskConical,
      color: "#8B5CF6"
    },
    {
      title: "Professionals",
      description: "Learn new concepts efficiently.",
      icon: Briefcase,
      color: "#14B8A6"
    },
    {
      title: "Self-Learners",
      description: "Organize and master self-study materials.",
      icon: UserRound,
      color: "#F59E0B"
    }
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <section className="w-full py-20 bg-[#0A0A0A] border-t border-white/5 relative z-10 flex flex-col items-center">
      <div className="w-full max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#F9FAFB] tracking-tight">
            Designed For Better Learning
          </h2>
          <p className="text-[#A1A1AA] mt-4 max-w-xl mx-auto">
            Studflow adapts to your workflow, whether you&apos;re passing exams or staying ahead in your career.
          </p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {cards.map((card, i) => (
            <motion.div 
              key={i}
              variants={item}
              className="bg-[#171717] border border-white/5 rounded-[16px] p-6 flex flex-col gap-4 hover:bg-[#1F1F1F] hover:border-white/10 transition-colors"
            >
              <div className="p-3 rounded-xl w-fit" style={{ backgroundColor: `${card.color}15` }}>
                <card.icon className="w-6 h-6" style={{ color: card.color }} />
              </div>
              <div>
                <h3 className="text-[#F9FAFB] font-semibold text-lg">{card.title}</h3>
                <p className="text-[#A1A1AA] text-sm mt-1">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
