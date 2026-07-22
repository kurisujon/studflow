import { Manrope } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-landing" });

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${manrope.variable}`} style={{ fontFamily: "var(--font-landing), system-ui, sans-serif" }}>
      {children}
    </div>
  );
}
