import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { DashboardPreviewSection } from "@/components/landing/DashboardPreviewSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0e1a] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">
      <LandingNavbar />
      
      <main className="relative flex flex-col items-center w-full">
        <HeroSection />
        <TrustSection />
        <HowItWorksSection />
        <DashboardPreviewSection />
        <FeaturesSection />
        <TestimonialSection />
        <FAQSection />
        <CTASection />
      </main>

      <LandingFooter />
    </div>
  );
}
