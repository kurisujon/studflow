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
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "Explain Difficult Topics",
      description: "Highlight any confusing paragraph and instantly ask the AI to simplify it, provide examples, or translate it into easier terms without leaving your document.",
      benefits: ["Learn without switching apps", "Maintain context", "Break down complex jargon"],
      icon: Search,
      mockupType: "reader",
      color: "from-purple-500 to-indigo-500"
    },
    {
      title: "AI Chat Assistant",
      description: "Stuck on a concept? Chat directly with an AI tutor that deeply understands the exact document you're reading. Ask questions and get grounded answers instantly.",
      benefits: ["Personalized 1-on-1 tutoring", "Document-aware answers", "24/7 availability"],
      icon: MessageSquare,
      mockupType: "tutor",
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Generate Flashcards",
      description: "Automatically transform your study materials into digital flashcards to master active recall. Don't waste hours creating them manually.",
      benefits: ["Active recall practice", "Better memory retention", "Spaced repetition ready"],
      icon: Layers,
      mockupType: "flashcards",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Generate Quiz",
      description: "Test your understanding through automatically generated quizzes tailored to your reading. Identify your weak spots before the exam.",
      benefits: ["Measure progress", "Practice knowledge retrieval", "Instant feedback"],
      icon: CircleHelp,
      mockupType: "quizzes",
      color: "from-indigo-500 to-blue-500"
    },
    {
      title: "Highlight Key Concepts",
      description: "Use smart annotation tools to highlight, take notes, and link your thoughts directly to the source text for an organized review later.",
      benefits: ["Stay organized", "Easy review sessions", "Visual learning"],
      icon: Highlighter,
      mockupType: "highlights",
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <section id="features" className="w-full py-32 bg-[#0a0e1a] overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 flex flex-col items-center mb-24 mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
        >
          <Bot className="w-4 h-4" />
          <span>Core Capabilities</span>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight text-center max-w-3xl"
        >
          Your entirely new <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">study workflow.</span>
        </motion.h2>
      </div>

      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 space-y-32 mx-auto">
        {features.map((feature, idx) => {
          const isReversed = idx % 2 === 1;
          const flexClass = isReversed ? "lg:flex-row-reverse" : "lg:flex-row";
          
          return (
            <div key={idx} className={["flex flex-col items-center gap-12 lg:gap-20", flexClass].join(" ")}>
              
              {/* Text Content */}
              <motion.div 
                initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex-1 w-full"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-gradient-to-br ${feature.color}`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-white/60 text-lg md:text-xl mb-8 leading-relaxed font-light">{feature.description}</p>
                
                <ul className="space-y-4">
                  {feature.benefits.map((benefit, bIdx) => (
                    <li key={bIdx} className="flex items-center gap-3 text-white/80">
                      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <span className="text-base font-medium">{benefit}</span>
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
                className="flex-1 w-full"
              >
                <div className="relative w-full min-h-[350px] lg:min-h-[450px] bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm flex items-center justify-center p-8 group">
                  {/* Subtle hover glow effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br ${feature.color} blur-3xl`} />
                  
                  <div className="relative z-10 w-full h-full">
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
      <div className="w-full h-full flex flex-col gap-4">
        <motion.div 
          animate={{ y: [10, 0, 10] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-12 bg-white/5 border border-white/10 rounded-xl flex items-center px-4"
        >
          <div className="w-24 h-2 bg-white/20 rounded-full" />
        </motion.div>
        <div className="flex-1 flex gap-4">
          <motion.div 
            animate={{ opacity: [0.6, 1, 0.6] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4"
          >
            <div className="w-full h-3 bg-white/10 rounded-full" />
            <div className="w-5/6 h-3 bg-white/10 rounded-full" />
            <div className="w-4/6 h-3 bg-white/10 rounded-full" />
            {type === "highlights" && (
              <div className="w-full h-3 bg-indigo-500/40 rounded-full mt-4" />
            )}
          </motion.div>
          <div className="hidden sm:block w-1/3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 p-5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="space-y-3">
              <div className="w-full h-2 bg-indigo-500/40 rounded-full" />
              <div className="w-4/5 h-2 bg-indigo-500/40 rounded-full" />
              <div className="w-full h-2 bg-indigo-500/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "reader") {
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative">
          <div className="w-3/4 h-3 bg-white/20 rounded-full mb-8" />
          <div className="space-y-3 relative">
            <div className="w-full h-2 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="w-full h-2 bg-white/10 rounded-full" />
              <motion.div 
                animate={{ width: ["0%", "100%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
              />
            </div>
            <div className="w-4/5 h-2 bg-white/10 rounded-full" />
          </div>
          
          <motion.div 
            animate={{ opacity: [0, 1, 1, 0], scale: [0.95, 1, 1, 0.95], y: [10, 0, 0, 10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#12182b] shadow-2xl border border-white/10 p-4 rounded-xl z-10 w-56"
          >
            <div className="flex items-center gap-3 mb-3">
              <Bot className="w-5 h-5 text-purple-400" />
              <div className="h-2 w-20 bg-purple-400/40 rounded-full" />
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
      <div className="w-full h-full flex flex-col justify-end gap-4">
        <div className="flex-1 overflow-hidden space-y-6 pr-4 pt-4">
          <div className="flex justify-end">
            <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-lg">
              <div className="w-32 h-2 bg-white/40 rounded-full mb-3" />
              <div className="w-24 h-2 bg-white/40 rounded-full" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-sm w-full">
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
        <div className="h-14 bg-white/5 border border-white/10 rounded-full flex items-center px-6 mt-4">
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-5 bg-indigo-400 rounded-full" 
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
          <div className="absolute inset-0 backface-hidden bg-[#12182b] border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col z-10">
            <div className="w-full flex justify-between items-center mb-8">
              <div className="w-16 h-2 bg-white/20 rounded-full" />
              <Layers className="w-6 h-6 text-cyan-400/50" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-full h-4 bg-white/30 rounded-full" />
              <div className="w-3/4 h-4 bg-white/30 rounded-full" />
            </div>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-center rotate-y-180">
            <div className="w-full h-4 bg-cyan-400/50 rounded-full mb-4" />
            <div className="w-5/6 h-4 bg-cyan-400/50 rounded-full mb-8" />
            <div className="w-full flex justify-center gap-4 mt-auto">
              <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 font-bold">✗</div>
              <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 font-bold">✓</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (type === "quizzes") {
    return (
      <div className="w-full max-w-md mx-auto h-full flex flex-col justify-center gap-6">
        <div className="space-y-3 mb-6">
          <div className="w-full h-4 bg-white/30 rounded-full" />
          <div className="w-5/6 h-4 bg-white/30 rounded-full" />
        </div>
        
        <div className="space-y-4">
          <div className="w-full h-14 bg-white/5 rounded-xl border border-white/10 flex items-center px-5 gap-4 hover:bg-white/10 transition-colors">
            <div className="w-6 h-6 rounded-full border-2 border-white/30" />
            <div className="w-1/2 h-3 bg-white/30 rounded-full" />
          </div>
          
          <motion.div 
            animate={{ 
              backgroundColor: ["rgba(255,255,255,0.05)", "rgba(59,130,246,0.15)"], 
              borderColor: ["rgba(255,255,255,0.1)", "rgba(59,130,246,0.4)"] 
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="w-full h-14 rounded-xl border flex items-center px-5 gap-4 relative overflow-hidden"
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="w-3/4 h-3 bg-blue-400/50 rounded-full" />
            <motion.div 
               animate={{ opacity: [0, 1] }}
               transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
               className="absolute right-5 text-blue-400 font-bold"
            >
              +10
            </motion.div>
          </motion.div>
          
          <div className="w-full h-14 bg-white/5 rounded-xl border border-white/10 flex items-center px-5 gap-4 hover:bg-white/10 transition-colors">
            <div className="w-6 h-6 rounded-full border-2 border-white/30" />
            <div className="w-2/3 h-3 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
