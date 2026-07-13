"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import * as Lucide from "lucide-react";
const { LayoutDashboard, FileText, Layers, CircleHelp, LineChart, ChevronRight } = Lucide as unknown as Record<string, React.ElementType>;

export function DashboardPreviewSection() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "notes", label: "Notes", icon: Layers },
    { id: "quizzes", label: "Quiz History", icon: CircleHelp },
    { id: "progress", label: "Progress", icon: LineChart }
  ];

  return (
    <section className="w-full py-32 bg-background flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-7xl px-6 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Your Complete Study Environment</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need is organized in one beautiful, calm digital workspace.
        </p>
      </div>

      <div className="w-full max-w-6xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full min-h-[500px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
        >
          {/* Sidebar */}
          <div className="w-16 md:w-64 bg-card border-r border-border flex flex-col p-4 gap-2 z-10">
            <div className="hidden md:flex items-center gap-2 px-2 py-4 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground">S</div>
              <span className="font-bold text-foreground">Studflow</span>
            </div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden md:block">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Main Area View */}
          <div className="flex-1 bg-background p-6 md:p-10 relative overflow-hidden flex flex-col gap-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex flex-col gap-6"
            >
              {/* Header Mock */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="h-6 w-32 bg-muted rounded-md" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-card border border-border rounded-full" />
                  <div className="h-8 w-24 bg-primary/20 rounded-md" />
                </div>
              </div>

              {/* Dynamic Content based on active tab */}
              {activeTab === "dashboard" && (
                <div className="flex-1 flex flex-col gap-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-card border border-border p-4 rounded-xl flex flex-col gap-2 hover:-translate-y-1 transition-transform cursor-pointer shadow-sm">
                        <div className="h-3 w-16 bg-muted-foreground/30 rounded-full" />
                        <div className="h-8 w-24 bg-foreground/20 rounded-md" />
                      </div>
                    ))}
                  </div>
                  {/* Main content grid */}
                  <div className="flex-1 grid grid-cols-3 gap-6">
                    <div className="col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4 group cursor-pointer">
                       <div className="flex justify-between items-center">
                         <div className="h-4 w-32 bg-muted-foreground/30 rounded-full" />
                         <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                       </div>
                       <div className="flex-1 flex items-end gap-2 pt-8">
                         {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                           <motion.div 
                             key={i}
                             initial={{ height: 0 }}
                             animate={{ height: `${h}%` }}
                             transition={{ duration: 1, delay: i * 0.1 }}
                             className="flex-1 bg-primary/20 hover:bg-primary transition-colors rounded-t-sm"
                           />
                         ))}
                       </div>
                    </div>
                    <div className="col-span-1 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
                      <div className="h-4 w-24 bg-muted-foreground/30 rounded-full" />
                      <div className="flex-1 flex flex-col gap-3 justify-center">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-10 w-full bg-muted rounded-lg flex items-center px-3 gap-2">
                             <div className="w-4 h-4 rounded-full bg-primary/40" />
                             <div className="h-2 flex-1 bg-muted-foreground/20 rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== "dashboard" && (
                <div className="flex-1 bg-card border border-border rounded-xl p-8 flex flex-col gap-6 shadow-sm">
                   <div className="h-5 w-48 bg-foreground/20 rounded-full mb-4" />
                   <div className="space-y-4">
                     {[1, 2, 3, 4].map((i) => (
                       <div key={i} className="w-full h-16 bg-muted rounded-lg flex items-center px-6 gap-4 hover:bg-muted/80 cursor-pointer transition-colors">
                          <div className="w-8 h-8 rounded-md bg-primary/20 flex-shrink-0" />
                          <div className="space-y-2 flex-1">
                             <div className="h-3 w-1/3 bg-muted-foreground/40 rounded-full" />
                             <div className="h-2 w-1/4 bg-muted-foreground/20 rounded-full" />
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
