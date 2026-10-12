import Link from "next/link";
import Image from "next/image";
import { LandingContainer } from "./ui/LandingContainer";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#F8FAFC] border-t border-[#E2E8F0] pt-16 sm:pt-24 lg:pt-32 pb-12">
      <LandingContainer variant="default">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group mb-6">
              <Image src="/studflow_logo.png" alt="StudFlow Logo" width={32} height={32} />
              <span className="text-xl font-bold tracking-tight text-[#0F172A]">
                StudFlow
              </span>
            </Link>
            <p className="text-[#697386] text-sm leading-relaxed max-w-xs">
              Turn your own source material into summaries, practice, review, notes, and grounded AI conversations.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#0F172A] mb-4 text-base">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">How it works</Link></li>
              <li><Link href="#benefits" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">Benefits</Link></li>
              <li><Link href="#faq" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#0F172A] mb-4 text-base">Account</h4>
            <ul className="space-y-3">
              <li><Link href="#faq" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">FAQ</Link></li>
              <li><Link href="/sign-in" className="text-[#64748B] hover:text-[#4F46E5] text-sm transition-colors">Sign in</Link></li>
              <li><Link href="/sign-up" className="text-[#64748B] hover:text-[#4F46E5] text-sm transition-colors">Create account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#0F172A] mb-4 text-base">Study flow</h4>
            <p className="max-w-xs text-sm leading-6 text-[#697386]">Upload material, explore the generated guide, learn with AI, practice, review, and track the progress your account records.</p>
          </div>
        </div>

        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[#64748B] text-sm">
            © {currentYear} StudFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            Built for focused learning.
          </div>
        </div>
      </LandingContainer>
    </footer>
  );
}
