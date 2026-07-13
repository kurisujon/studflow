"use client";

import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
const { Upload, BrainCircuit, FileText } = Lucide as unknown as Record<string, React.ElementType>;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-24 bg-card border-y border-border flex flex-col items-center">
      <div className="w-full max-w-7xl px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Designed For Better Learning</h2>
          <p className="text-lg text-muted-foreground">
            From raw documents to complete mastery in three simple steps.
          </p>
        </div>

        <div className="relative mt-20">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-border" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-lg flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8 text-primary" />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">1</div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Upload Materials</h3>
              <p className="text-muted-foreground">
                Drop your PDFs, lecture slides, video links, or past notes securely into your workspace.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-lg flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                <BrainCircuit className="w-8 h-8 text-secondary" />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-secondary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">2</div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">AI Processing</h3>
              <p className="text-muted-foreground">
                Our AI instantly reads, understands, and extracts the core concepts into summaries and flashcards.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-lg flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-primary" />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">3</div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Start Learning</h3>
              <p className="text-muted-foreground">
                Review study materials, answer auto-generated quizzes, and chat with your AI tutor.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
