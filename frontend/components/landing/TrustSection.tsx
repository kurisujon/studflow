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
      colorClass: "text-primary", bgClass: "bg-primary/15"
    },
    {
      title: "Researchers",
      description: "Extract important information from documents.",
      icon: FlaskConical,
      colorClass: "text-secondary", bgClass: "bg-secondary/15"
    },
    {
      title: "Professionals",
      description: "Learn new concepts efficiently.",
      icon: Briefcase,
      colorClass: "text-primary", bgClass: "bg-primary/15"
    },
    {
      title: "Self-Learners",
      description: "Organize and master self-study materials.",
      icon: UserRound,
      colorClass: "text-secondary", bgClass: "bg-secondary/15"
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
    <section className="w-full py-20 bg-background border-t border-border relative z-10 flex flex-col items-center">
      <div className="w-full max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Designed For Better Learning
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
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
              className="bg-card border border-border rounded-[16px] p-6 flex flex-col gap-4 hover:bg-muted hover:border-border transition-colors"
            >
              <div className={`p-3 rounded-xl w-fit ${card.bgClass}`}>
                <card.icon className={`w-6 h-6 ${card.colorClass}`} />
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-lg">{card.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
