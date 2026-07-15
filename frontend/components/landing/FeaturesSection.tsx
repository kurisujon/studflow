"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { FileText, Bot, Layers, CircleHelp, Search, CheckCircle2, MessageSquare, Highlighter } = Lucide as unknown as Record<string, React.ElementType>;

export function FeaturesSection() {
  const features = [
    {
      title: "Summarize Notes",
      description: "Upload any learning material and let our AI extract the core concepts into simple, highly readable summaries. Never get lost in a 50-page reading assignment again.",
      benefits: ["Save reading time", "Understand key concepts quickly", "Focus on important information"],
      icon: FileText,
      mockupType: "summary",
      color: "from-blue-500 to-indigo-500",
      accent: "#4F7BFF"
    },
    {
      title: "Explain Difficult Topics",
      description: "Highlight any confusing paragraph and instantly ask the AI to simplify it, provide examples, or translate it into easier terms without leaving your document.",
      benefits: ["Learn without switching apps", "Maintain context", "Break down complex jargon"],
      icon: Search,
      mockupType: "reader",
      color: "from-purple-500 to-indigo-500",
      accent: "#7C5CFF"
    },
    {
      title: "AI Chat Assistant",
      description: "Stuck on a concept? Chat directly with an AI tutor that deeply understands the exact document you're reading. Ask questions and get grounded answers instantly.",
      benefits: ["Personalized 1-on-1 tutoring", "Document-aware answers", "24/7 availability"],
      icon: MessageSquare,
      mockupType: "tutor",
      color: "from-indigo-500 to-purple-500",
      accent: "#4F7BFF"
    },
    {
      title: "Generate Flashcards",
      description: "Automatically transform your study materials into digital flashcards to master active recall. Don't waste hours creating them manually.",
      benefits: ["Active recall practice", "Better memory retention", "Spaced repetition ready"],
      icon: Layers,
      mockupType: "flashcards",
      color: "from-blue-500 to-cyan-500",
      accent: "#7C5CFF"
    },
    {
      title: "Generate Quiz",
      description: "Test your understanding through automatically generated quizzes tailored to your reading. Identify your weak spots before the exam.",
      benefits: ["Measure progress", "Practice knowledge retrieval", "Instant feedback"],
      icon: CircleHelp,
      mockupType: "quizzes",
      color: "from-indigo-500 to-blue-500",
      accent: "#4F7BFF"
    },
    {
      title: "Highlight Key Concepts",
      description: "Use smart annotation tools to highlight, take notes, and link your thoughts directly to the source text for an organized review later.",
      benefits: ["Stay organized", "Easy review sessions", "Visual learning"],
      icon: Highlighter,
      mockupType: "highlights",
      color: "from-purple-500 to-pink-500",
      accent: "#7C5CFF"
    }
  ];

  return (
    <section id="features" className="w-full pt-[120px] pb-[160px] bg-[#050816] overflow-hidden relative border-t border-[rgba(255,255,255,.05)]">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-[#4F7BFF]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-[#7C5CFF]/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] px-6 md:px-12 lg:px-20 flex flex-col items-center mb-[120px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(79,123,255,0.1)] border border-[rgba(79,123,255,0.2)] text-[#4F7BFF] text-sm font-medium mb-6"
        >
          <Bot className="w-4 h-4" />
          <span>Core Capabilities</span>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[48px] md:text-[56px] font-bold text-white tracking-tight text-center max-w-[800px] leading-[1.2]"
        >
          Your entirely new <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7BFF] to-[#7C5CFF]">study workflow.</span>
        </motion.h2>
      </div>

      <div className="relative z-10 w-full max-w-[1400px] px-6 md:px-12 lg:px-20 space-y-[160px] mx-auto">
        {features.map((feature, idx) => {
          const isReversed = idx % 2 === 1;
          const flexClass = isReversed ? "lg:flex-row-reverse" : "lg:flex-row";
          
          return (
            <div key={idx} className={["flex flex-col items-center gap-12 lg:gap-24", flexClass].join(" ")}>
              
              {/* Text Content */}
              <motion.div 
                initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex-1 w-full lg:w-1/2"
              >
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center mb-8 shadow-[0_10px_20px_rgba(0,0,0,.2)] bg-gradient-to-br ${feature.color}`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[32px] md:text-[40px] font-bold text-white mb-6 leading-[1.2] tracking-tight">{feature.title}</h3>
                <p className="text-white/60 text-[18px] mb-8 leading-[1.6]">{feature.description}</p>
                
                <ul className="space-y-4">
                  {feature.benefits.map((benefit, bIdx) => (
                    <li key={bIdx} className="flex items-center gap-3 text-white/80">
                      <div className="w-6 h-6 rounded-full bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: feature.accent }} />
                      </div>
                      <span className="text-[16px] font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Mockup Visual */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                className="flex-1 w-full lg:w-1/2"
              >
                <div className="relative w-full min-h-[400px] lg:min-h-[500px] bg-[rgba(14,19,38,.6)] border border-[rgba(255,255,255,.08)] rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.3)] backdrop-blur-[20px] flex items-center justify-center p-8 group hover:shadow-[0_20px_60px_rgba(0,0,0,.4),0_0_40px_rgba(79,123,255,.1)] transition-all duration-500">
                  {/* Subtle hover glow effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br ${feature.color} blur-[60px]`} />
                  
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <FeatureMockup type={feature.mockupType} />
                  </div>
                </div>
              </motion.div>

            </div>
          );
        })}
      </div>
    </section>
  );
}

function FeatureMockup({ type }: { type: string }) {
  if (type === "summary" || type === "highlights") {
    return (
      <div className="w-full h-full flex flex-col gap-5 justify-center">
        <motion.div 
          animate={{ y: [5, -5, 5] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-12 bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.08)] rounded-xl flex items-center px-5 shadow-[0_10px_30px_rgba(0,0,0,.2)] backdrop-blur-[10px]"
        >
          <div className="w-24 h-2 bg-white/20 rounded-full" />
        </motion.div>
        <div className="flex w-full gap-5">
          <motion.div 
            animate={{ opacity: [0.7, 1, 0.7] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex-1 bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.08)] rounded-xl p-6 space-y-5 shadow-[0_10px_30px_rgba(0,0,0,.2)] backdrop-blur-[10px]"
          >
            <div className="w-full h-2.5 bg-white/10 rounded-full" />
            <div className="w-5/6 h-2.5 bg-white/10 rounded-full" />
            <div className="w-4/6 h-2.5 bg-white/10 rounded-full" />
            {type === "highlights" && (
              <div className="w-full h-2.5 bg-[#4F7BFF]/40 rounded-full mt-6 shadow-[0_0_10px_rgba(79,123,255,.2)]" />
            )}
          </motion.div>
          <div className="hidden sm:block w-1/3 bg-[#4F7BFF]/10 rounded-xl border border-[#4F7BFF]/20 p-5 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,.2)]">
            <div className="w-10 h-10 rounded-full bg-[#4F7BFF]/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#4F7BFF]" />
            </div>
            <div className="space-y-3">
              <div className="w-full h-2 bg-[#4F7BFF]/40 rounded-full" />
              <div className="w-4/5 h-2 bg-[#4F7BFF]/40 rounded-full" />
              <div className="w-full h-2 bg-[#4F7BFF]/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "reader") {
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="w-full max-w-sm bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.08)] rounded-2xl p-6 space-y-5 relative shadow-[0_10px_30px_rgba(0,0,0,.2)] backdrop-blur-[10px]">
          <div className="w-3/4 h-2.5 bg-white/20 rounded-full mb-8" />
          <div className="space-y-4 relative">
            <div className="w-full h-2 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="w-full h-2 bg-white/10 rounded-full" />
              <motion.div 
                animate={{ width: ["0%", "100%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-2 bg-[#7C5CFF] rounded-full shadow-[0_0_15px_rgba(124,92,255,0.6)]" 
              />
            </div>
            <div className="w-4/5 h-2 bg-white/10 rounded-full" />
          </div>
          
          <motion.div 
            animate={{ opacity: [0, 1, 1, 0], scale: [0.95, 1, 1, 0.95], y: [10, 0, 0, 10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[rgba(16,20,38,.9)] shadow-[0_20px_50px_rgba(0,0,0,.5)] border border-[rgba(255,255,255,.1)] p-4 rounded-xl z-10 w-56 backdrop-blur-[20px]"
          >
            <div className="flex items-center gap-3 mb-3">
              <Bot className="w-5 h-5 text-[#7C5CFF]" />
              <div className="h-2 w-20 bg-[#7C5CFF]/40 rounded-full" />
            </div>
            <div className="h-2 w-full bg-white/20 rounded-full mb-2" />
            <div className="h-2 w-5/6 bg-white/20 rounded-full" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (type === "tutor") {
    return (
      <div className="w-full h-full flex flex-col justify-center gap-5">
        <div className="flex-1 w-full max-h-[300px] overflow-hidden space-y-6 flex flex-col justify-end">
          <div className="flex justify-end">
            <div className="bg-[#4F7BFF] text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-[0_10px_20px_rgba(79,123,255,.2)]">
              <div className="w-32 h-2 bg-white/40 rounded-full mb-3" />
              <div className="w-24 h-2 bg-white/40 rounded-full" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#4F7BFF]/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-[#4F7BFF]" />
            </div>
            <div className="bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] p-4 rounded-2xl rounded-tl-sm w-full shadow-[0_10px_20px_rgba(0,0,0,.1)]">
              <motion.div 
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-2 bg-white/30 rounded-full mb-3" 
              />
              <motion.div 
                animate={{ width: ["0%", "80%"] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2, ease: "easeInOut" }}
                className="h-2 bg-white/30 rounded-full" 
              />
            </div>
          </div>
        </div>
        <div className="h-14 bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.08)] rounded-full flex items-center px-6 mt-2 shadow-[0_5px_15px_rgba(0,0,0,.1)]">
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-5 bg-[#4F7BFF] rounded-full" 
          />
        </div>
      </div>
    );
  }

  if (type === "flashcards") {
    return (
      <div className="w-full h-full flex items-center justify-center relative perspective-[1200px]">
        <motion.div 
          animate={{ rotateY: [0, 180, 180, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-64 h-80 preserve-3d"
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-[#0E1326] border border-[rgba(255,255,255,.08)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,.4)] p-8 flex flex-col z-10 backdrop-blur-[10px]">
            <div className="w-full flex justify-between items-center mb-8">
              <div className="w-16 h-2 bg-white/20 rounded-full" />
              <Layers className="w-6 h-6 text-[#7C5CFF]/50" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-full h-3 bg-white/30 rounded-full" />
              <div className="w-3/4 h-3 bg-white/30 rounded-full" />
            </div>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#4F7BFF]/10 to-[#7C5CFF]/10 border border-[#7C5CFF]/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,.4)] p-8 flex flex-col items-center justify-center text-center rotate-y-180 backdrop-blur-[10px]">
            <div className="w-full h-3 bg-[#7C5CFF]/50 rounded-full mb-4" />
            <div className="w-5/6 h-3 bg-[#7C5CFF]/50 rounded-full mb-8" />
            <div className="w-full flex justify-center gap-4 mt-auto">
              <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 font-bold shadow-[0_0_15px_rgba(239,68,68,.2)]">✗</div>
              <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 font-bold shadow-[0_0_15px_rgba(34,197,94,.2)]">✓</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (type === "quizzes") {
    return (
      <div className="w-full max-w-sm mx-auto h-full flex flex-col justify-center gap-6">
        <div className="space-y-4 mb-6">
          <div className="w-full h-3 bg-white/30 rounded-full" />
          <div className="w-5/6 h-3 bg-white/30 rounded-full" />
        </div>
        
        <div className="space-y-4">
          <div className="w-full h-14 bg-[rgba(255,255,255,.03)] rounded-xl border border-[rgba(255,255,255,.08)] flex items-center px-5 gap-4">
            <div className="w-6 h-6 rounded-full border-2 border-white/20" />
            <div className="w-1/2 h-2.5 bg-white/20 rounded-full" />
          </div>
          
          <motion.div 
            animate={{ 
              backgroundColor: ["rgba(255,255,255,0.03)", "rgba(79,123,255,0.15)"], 
              borderColor: ["rgba(255,255,255,0.08)", "rgba(79,123,255,0.4)"] 
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="w-full h-14 rounded-xl border flex items-center px-5 gap-4 relative overflow-hidden shadow-[0_5px_15px_rgba(79,123,255,.1)]"
          >
            <div className="w-6 h-6 rounded-full bg-[#4F7BFF] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="w-3/4 h-2.5 bg-[#4F7BFF]/50 rounded-full" />
            <motion.div 
               animate={{ opacity: [0, 1] }}
               transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
               className="absolute right-5 text-[#4F7BFF] font-bold text-sm"
            >
              +10
            </motion.div>
          </motion.div>
          
          <div className="w-full h-14 bg-[rgba(255,255,255,.03)] rounded-xl border border-[rgba(255,255,255,.08)] flex items-center px-5 gap-4">
            <div className="w-6 h-6 rounded-full border-2 border-white/20" />
            <div className="w-2/3 h-2.5 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
