import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://studflow.webcris.dev"), // Verified production URL
  alternates: {
    canonical: '/',
  },
  title: {
    default: "StudFlow — AI Learning Workspace",
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
    url: "https://studflow.webcris.dev",
    title: "StudFlow — AI Learning Workspace",
    description: "Transform any document into a smart study session. Automatically generate summaries, flashcards, and quizzes from your PDFs.",
    siteName: "Studflow",
    images: [
      {
        url: "/feature-dashboard.jpg",
        width: 1200,
        height: 630,
        alt: "Studflow — AI Study Workflow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudFlow — AI Learning Workspace",
    description: "Automatically generate summaries, flashcards, and quizzes from your PDFs.",
    images: ["/feature-dashboard.jpg"],
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
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        className={`${inter.variable} font-sans`}
        data-theme-color="system"
        suppressHydrationWarning
      >
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
