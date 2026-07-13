import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { DashboardPreviewSection } from "@/components/landing/DashboardPreviewSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { LearningMomentSection } from "@/components/landing/LearningMomentSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/30">
      <LandingNavbar />
      
      <main className="relative flex flex-col items-center w-full">
        <HeroSection />
        <TrustSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DashboardPreviewSection />
        <ProblemSection />
        <ComparisonSection />
        <LearningMomentSection />
        <FAQSection />
        <CTASection />
      </main>

      <LandingFooter />
    </div>
  );
}
