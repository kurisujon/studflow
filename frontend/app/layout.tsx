import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  metadataBase: new URL("https://studflow.com"), // Replace with your actual production URL
  title: {
    default: "Studflow — Best AI Note Taker & Study Workflow",
    template: "%s | Studflow",
  },
  description:
    "Transform any document into a smart study session. Upload a PDF or DOCX and let Studflow automatically generate concise summaries, active-recall flashcards, quizzes, and grounded AI chat.",
  keywords: ["studflow", "AI note taker", "study AI", "generate flashcards from PDF", "AI study workflow", "summarize PDF", "AI quiz generator", "smart studying"],
  authors: [{ name: "Studflow Team" }],
  creator: "Studflow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://studflow.com",
    title: "Studflow — Best AI Note Taker & Study Workflow",
    description: "Transform any document into a smart study session. Automatically generate summaries, flashcards, and quizzes from your PDFs.",
    siteName: "Studflow",
    images: [
      {
        url: "/og-image.png", // Add a nice OpenGraph image to the public/ folder later!
        width: 1200,
        height: 630,
        alt: "Studflow — AI Study Workflow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studflow — Best AI Note Taker & Study Workflow",
    description: "Automatically generate summaries, flashcards, and quizzes from your PDFs.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
