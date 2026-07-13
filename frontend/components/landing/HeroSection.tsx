"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as Lucide from "lucide-react";
const { BookOpen, Sparkles, Brain, NotebookPen, GraduationCap, Lightbulb, FileText, Bot, Layers, CheckCircle2 } = Lucide as unknown as Record<string, React.ElementType>;

export function HeroSection() {
  const floatingIcons = [
    { Icon: BookOpen, top: "10%", left: "15%", delay: 0 },
    { Icon: Sparkles, top: "20%", right: "20%", delay: 1 },
    { Icon: Brain, top: "60%", left: "10%", delay: 2 },
    { Icon: NotebookPen, top: "70%", right: "15%", delay: 0.5 },
    { Icon: GraduationCap, top: "85%", left: "25%", delay: 1.5 },
    { Icon: Lightbulb, top: "40%", right: "8%", delay: 2.5 },
  ];

  return (
    <section className="relative w-full min-h-screen pt-32 pb-24 flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Floating Elements Background */}
      {floatingIcons.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/30 pointer-events-none hidden md:block"
          style={{ top: item.top, left: item.left, right: item.right }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: item.delay
          }}
        >
          <item.Icon className="w-12 h-12" />
        </motion.div>
      ))}

      <div className="w-full max-w-7xl px-6 relative z-10 flex flex-col items-center text-center">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8 font-medium text-sm shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Your personal AI study desk.</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-8">
            Study Smarter With AI That <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Understands You</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
            Upload your documents, understand complex topics, and create personalized study resources with your AI-powered learning companion.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
            >
              Start Learning Free
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-card hover:bg-muted text-foreground border border-border rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>

        {/* Hero Visual: Floating Workspace */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full mt-24 relative max-w-5xl"
        >
          <div className="relative w-full aspect-[16/9] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex items-stretch">
            
            {/* Left: PDF Pages */}
            <div className="hidden md:flex w-1/4 bg-background border-r border-border p-4 flex-col gap-4 overflow-hidden">
              <div className="w-full h-32 bg-card border border-border rounded-lg shadow-sm" />
              <div className="w-full h-32 bg-card border-2 border-primary rounded-lg shadow-sm" />
              <div className="w-full h-32 bg-card border border-border rounded-lg shadow-sm" />
            </div>

            {/* Center: Document Reader */}
            <div className="flex-1 bg-card p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="w-1/2 h-8 bg-muted rounded-md" />
              <div className="space-y-3 mt-4">
                <div className="w-full h-4 bg-muted rounded-md" />
                <div className="w-full h-4 bg-muted rounded-md" />
                <div className="w-5/6 h-4 bg-muted rounded-md" />
              </div>
              <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg mt-4">
                <div className="w-3/4 h-4 bg-primary/30 rounded-md mb-2" />
                <div className="w-1/2 h-4 bg-primary/30 rounded-md" />
              </div>
              <div className="space-y-3 mt-4">
                <div className="w-full h-4 bg-muted rounded-md" />
                <div className="w-4/5 h-4 bg-muted rounded-md" />
              </div>
            </div>

            {/* Right: AI Tutor Panel */}
            <div className="hidden md:flex w-1/3 bg-background border-l border-border flex-col">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="h-4 w-24 bg-muted rounded-md" />
              </div>
              <div className="flex-1 p-4 flex flex-col gap-4">
                <div className="self-end bg-primary/20 p-3 rounded-2xl rounded-tr-sm w-3/4">
                  <div className="w-full h-2 bg-primary/40 rounded-full mb-2" />
                  <div className="w-2/3 h-2 bg-primary/40 rounded-full" />
                </div>
                <motion.div 
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="self-start bg-muted p-3 rounded-2xl rounded-tl-sm w-5/6"
                >
                  <div className="w-full h-2 bg-muted-foreground/30 rounded-full mb-2" />
                  <div className="w-full h-2 bg-muted-foreground/30 rounded-full mb-2" />
                  <div className="w-4/5 h-2 bg-muted-foreground/30 rounded-full" />
                </motion.div>
              </div>
              <div className="p-4 border-t border-border">
                <div className="w-full h-10 bg-muted rounded-full" />
              </div>
            </div>

            {/* Floating Action Cards */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-12 -left-6 bg-surface border border-border p-3 rounded-xl shadow-xl flex items-center gap-3 z-20"
            >
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"><CheckCircle2 className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-foreground">AI Summary Generated</span>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-1/2 -right-8 bg-surface border border-border p-3 rounded-xl shadow-xl flex items-center gap-3 z-20"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent"><Layers className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-foreground">Flashcard Created</span>
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-12 -left-4 bg-surface border border-border p-3 rounded-xl shadow-xl flex items-center gap-3 z-20"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><FileText className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-foreground">Note Saved</span>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
