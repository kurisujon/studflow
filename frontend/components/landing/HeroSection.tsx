"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as Lucide from "lucide-react";
const { Bot, Layers } = Lucide as unknown as Record<string, React.ElementType>;

export function HeroSection() {
  return (
    <section className="relative w-full pt-32 pb-20 md:pt-40 md:pb-28 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-[100%] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl px-6 flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-primary/20 text-sm font-medium text-primary mb-8"
        >
          <SparklesIcon className="w-4 h-4" />
          <span>The smarter way to study is here</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mb-6 leading-tight"
        >
          Take Notes with Meetings, Video, PDF and Any Content Online Free
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          Studflow does more than simple transcription. It helps you capture ideas, organize information, and create clear notes from almost any type of content online in just a few clicks.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/sign-up"
            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[12px] font-semibold text-base transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            Start Studying Free
          </Link>
          <Link
            href="#how-it-works"
            className="w-full sm:w-auto px-8 py-4 bg-muted hover:bg-card text-foreground border border-border rounded-[12px] font-semibold text-base transition-colors"
          >
            See How It Works
          </Link>
        </motion.div>
      </div>

      {/* Hero Visual Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
        className="w-full max-w-6xl mt-20 px-6 relative z-10"
      >
        <div className="relative w-full aspect-[16/10] md:aspect-[16/9] bg-card rounded-[16px] border border-border shadow-2xl overflow-hidden flex">
          
          {/* Mock Sidebar */}
          <div className="hidden md:flex flex-col w-64 border-r border-border p-4 bg-background/50">
            <div className="h-4 w-24 bg-foreground/10 rounded mb-8" />
            <div className="space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-foreground/10">
                  <div className="w-6 h-6 rounded bg-foreground/10" />
                  <div className="h-3 w-32 bg-foreground/10 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Mock Main Content - Reader & AI */}
          <div className="flex-1 p-6 md:p-8 flex flex-col overflow-hidden relative">
            <div className="h-6 w-1/3 bg-foreground/10 rounded mb-6" />
            
            {/* Highlighted text simulation */}
            <div className="space-y-4">
              <div className="h-4 w-full bg-foreground/10 rounded" />
              <div className="h-4 w-full bg-foreground/10 rounded" />
              <div className="h-4 w-[85%] bg-foreground/10 rounded" />
              <div className="h-4 w-[90%] bg-primary/10 rounded border-l-2 border-primary pl-2" />
              <div className="h-4 w-full bg-foreground/10 rounded" />
            </div>

            {/* Floating UI Cards */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-8 top-8 p-4 bg-muted border border-border rounded-[12px] shadow-xl w-64 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">AI Summary</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-foreground/10 rounded" />
                <div className="h-2 w-[80%] bg-foreground/10 rounded" />
                <div className="h-2 w-[90%] bg-foreground/10 rounded" />
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute right-12 bottom-12 p-4 bg-muted border border-primary/20 rounded-[12px] shadow-xl w-72 backdrop-blur-xl flex gap-4"
            >
              <div className="p-3 bg-primary/10 rounded-lg h-fit">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Flashcards Ready</h4>
                <p className="text-xs text-muted-foreground">Generated 15 cards from this chapter for active recall.</p>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </section>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}
