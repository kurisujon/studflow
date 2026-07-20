"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";

const { Brain, Zap, Shield, TrendingUp } = Lucide as unknown as Record<string, React.ElementType>;

export function TrustSection() {
  const benefits = [
    {
      title: "Study 3x Faster",
      description: "Stop re-reading the same pages. AI extracts exactly what you need to know in seconds.",
      icon: Zap,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Reduce Information Overload",
      description: "Complex concepts are broken down into bite-sized, easy-to-understand explanations.",
      icon: Brain,
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Remember Longer",
      description: "Automated spaced repetition flashcards ensure you never forget what you've learned.",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Stay Organized",
      description: "All your highlights, notes, and AI chats are saved directly to the original document.",
      icon: Shield,
      color: "from-blue-500 to-indigo-500"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Study Sessions" },
    { value: "95%", label: "Summary Accuracy" },
    { value: "5x", label: "Faster Learning" },
    { value: "24/7", label: "AI Assistance" }
  ];

  return (
    <section className="w-full py-[120px] bg-[#050816] flex flex-col items-center relative overflow-hidden border-t border-[rgba(255,255,255,.05)] isolate">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
      
      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-20 mx-auto z-10">
        
        {/* Animated Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mb-[120px]">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <h3 className="text-[48px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 mb-2 tracking-tight">
                {stat.value}
              </h3>
              <p className="text-white/50 text-[14px] font-medium uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Benefits Header */}
        <div className="text-center mb-[80px]">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[48px] font-bold text-white mb-6 tracking-tight leading-[1.2]"
          >
            The Ultimate Learning Advantage
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[18px] text-white/60 max-w-[700px] mx-auto leading-[1.6]"
          >
            Transform how you absorb information. Less time reading, more time understanding.
          </motion.p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-[rgba(16,20,38,.65)] backdrop-blur-[20px] border border-[rgba(255,255,255,.08)] p-8 rounded-3xl hover:bg-[rgba(16,20,38,.85)] transition-all duration-300 group relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.25)] hover:shadow-[0_20px_60px_rgba(0,0,0,.35),0_0_30px_rgba(79,123,255,.1)] hover:-translate-y-1"
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-[0.05] blur-[80px] transition-opacity duration-500 rounded-full`} />
              
              <div className="flex flex-col h-full justify-between gap-6">
                <div className={`w-10 h-10 rounded-[14px] bg-gradient-to-br ${benefit.color} flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-[22px] mb-3 tracking-tight">{benefit.title}</h3>
                  <p className="text-white/60 text-[16px] leading-[1.6] max-w-[90%]">{benefit.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
