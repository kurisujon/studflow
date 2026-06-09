import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: {
    default: "Studflow — AI Study Workflow",
    template: "%s | Studflow",
  },
  description:
    "Upload a PDF or DOCX and let Studflow generate concise summaries, active-recall flashcards, and quizzes — automatically.",
  keywords: ["study", "AI", "flashcards", "quiz", "PDF", "summarize"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className="font-sans"
        data-theme-color="system"
        suppressHydrationWarning
      >
        <body>
          <ThemeProvider>
            <Navbar />
            <main
              style={{
                minHeight: "calc(100dvh - var(--nav-height))",
                paddingTop: "var(--nav-height)",
              }}
            >
              {children}
            </main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
