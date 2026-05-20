import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "Distill — AI Study Workflow",
    template: "%s | Distill",
  },
  description:
    "Upload a PDF or DOCX and let Distill generate concise summaries, active-recall flashcards, and quizzes — automatically.",
  keywords: ["study", "AI", "flashcards", "quiz", "PDF", "summarize"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <Navbar />
        <main
          style={{
            minHeight: "calc(100dvh - var(--nav-height))",
            paddingTop: "var(--nav-height)",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
