import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ProductDemoSection } from "@/components/landing/ProductDemoSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { PhilosophySection } from "@/components/landing/PhilosophySection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F9FAFB] font-sans overflow-x-hidden selection:bg-[#2563EB]/30">
      <LandingNavbar />
      
      {/* We use main to wrap content and offset for navbar if needed, though sticky nav usually overlays */}
      <main className="relative flex flex-col items-center w-full">
        <HeroSection />
        <TrustSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ProductDemoSection />
        <ComparisonSection />
        <PhilosophySection />
        <TestimonialSection />
        <FAQSection />
        <CTASection />
      </main>

      <LandingFooter />
    </div>
  );
}
