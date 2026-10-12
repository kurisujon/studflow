import { Manrope } from "next/font/google";
import { LandingNavbar } from "@/components/landing/LandingNavbar";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-landing" });

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`landing-shell min-h-dvh bg-[var(--landing-bg)] text-[var(--landing-text-primary)] ${manrope.variable}`} style={{ fontFamily: "var(--font-landing), system-ui, sans-serif" }}>
      <LandingNavbar />
      {children}
    </div>
  );
}
