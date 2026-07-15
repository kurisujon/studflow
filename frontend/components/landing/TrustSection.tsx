"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";

const { Brain, Clock, Zap, Shield, TrendingUp, BarChart } = Lucide as unknown as Record<string, React.ElementType>;

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
    <section className="w-full py-32 bg-[#0a0e1a] flex flex-col items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
      
      <div className="w-full max-w-7xl px-4 sm:px-6 mx-auto z-10">
        
        {/* Animated Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mb-32 border-y border-white/5 py-12">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 mb-2">
                {stat.value}
              </h3>
              <p className="text-white/50 text-sm md:text-base font-medium uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Benefits Header */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight"
          >
            The Ultimate Learning Advantage
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto"
          >
            Transform how you absorb information. Less time reading, more time understanding.
          </motion.p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white/[0.02] border border-white/10 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group relative overflow-hidden backdrop-blur-sm"
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-[0.05] blur-3xl transition-opacity duration-500 rounded-full`} />
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white text-xl md:text-2xl mb-3">{benefit.title}</h3>
              <p className="text-white/60 text-base md:text-lg leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
