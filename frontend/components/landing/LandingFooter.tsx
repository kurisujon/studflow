import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#F8FAFC] border-t border-[#E2E8F0] pt-24 md:pt-32 pb-12">
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">
          
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group mb-6">
              <Image src="/studflow_logo.png" alt="StudFlow Logo" width={32} height={32} />
              <span className="text-xl font-bold tracking-tight text-[#0F172A]">
                StudFlow
              </span>
            </Link>
            <p className="text-[#64748B] text-sm leading-relaxed max-w-xs">
              The ultimate AI study workflow. Transform any document into a personalized study session instantly.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#0F172A] mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">How it works</Link></li>
              <li><Link href="#benefits" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">Benefits</Link></li>
              <li><Link href="/pricing" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#0F172A] mb-4">Support</h4>
            <ul className="space-y-3">
              <li><Link href="#faq" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">FAQ</Link></li>
              <li><a href="mailto:support@studflow.com" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">Contact Us</a></li>
              <li><Link href="/terms" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-[#64748B] hover:text-[#168BFF] text-sm transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#0F172A] mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#168BFF] hover:border-[#168BFF]/30 transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#168BFF] hover:border-[#168BFF]/30 transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#168BFF] hover:border-[#168BFF]/30 transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>
          
        </div>

        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[#64748B] text-sm">
            © {currentYear} StudFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            Made with <span className="text-[#168BFF]">♥</span> for students.
          </div>
        </div>
      </div>
    </footer>
  );
}
