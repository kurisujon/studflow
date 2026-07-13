"use client";

import { XCircle, CheckCircle2 } from "lucide-react";

export function ComparisonSection() {
  const traditional = [
    "Manual reading",
    "Searching explanations",
    "Creating notes manually",
    "Forgetting important concepts",
    "No progress tracking"
  ];

  const studflow = [
    "AI summaries",
    "Document-grounded answers",
    "Smart notes",
    "Automatic study materials",
    "Learning progress tracking"
  ];

  return (
    <section className="w-full py-24 bg-card border-y border-border flex flex-col items-center">
      <div className="w-full max-w-5xl px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-center mb-16">
          Why Choose Studflow
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Traditional */}
          <div className="bg-muted/50 border border-border rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-muted-foreground mb-6 border-b border-border pb-4">
              Traditional Studying
            </h3>
            <ul className="space-y-4">
              {traditional.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <XCircle className="w-5 h-5 text-red-500/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Studflow */}
          <div className="bg-gradient-to-b from-[#2563EB]/10 to-transparent border border-primary/20 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="text-[10px] font-bold tracking-wider text-primary uppercase bg-primary/10 px-2 py-1 rounded">The Modern Way</div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-6 border-b border-border pb-4">
              Studflow
            </h3>
            <ul className="space-y-4">
              {studflow.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
