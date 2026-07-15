"use client";

import Link from "next/link";
import Image from "next/image";

const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export function LandingFooter() {
  return (
    <footer className="w-full bg-[#050816] border-t border-[rgba(255,255,255,.05)] flex flex-col items-center pt-[120px] pb-[40px]">
      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-20 mx-auto flex flex-col md:flex-row justify-between items-start gap-16 md:gap-12">
        
        {/* Brand */}
        <div className="flex flex-col items-start gap-6 max-w-lg">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl text-white">
            <Image src="/studflow_logo.png" alt="Studflow Logo" width={32} height={32} />
            Studflow
          </Link>
          <p className="text-white/60 text-[15px] leading-[1.6] font-light">
            The AI-powered study workspace that transforms your documents into personalized learning sessions. Stop reading and start understanding.
          </p>
          <div className="flex items-center gap-6 text-white/40 mt-4">
            <Link href="https://github.com/kurisujon/studflow" className="hover:text-white transition-colors">
              <GithubIcon />
            </Link>
            <Link href="#" className="hover:text-[#4F7BFF] transition-colors">
              <TwitterIcon />
            </Link>
            <Link href="#" className="hover:text-[#4F7BFF] transition-colors">
              <LinkedinIcon />
            </Link>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-24 gap-y-12">
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2 text-[15px]">Product</h4>
            <Link href="#features" className="text-white/60 hover:text-white text-[15px] transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-white/60 hover:text-white text-[15px] transition-colors">How it works</Link>
            <Link href="#faq" className="text-white/60 hover:text-white text-[15px] transition-colors">FAQ</Link>
            <Link href="/sign-up" className="text-white/60 hover:text-white text-[15px] transition-colors">Sign up</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2 text-[15px]">Resources</h4>
            <Link href="/docs" className="text-white/60 hover:text-white text-[15px] transition-colors">Documentation</Link>
            <Link href="#" className="text-white/60 hover:text-white text-[15px] transition-colors">Help Center</Link>
            <Link href="#" className="text-white/60 hover:text-white text-[15px] transition-colors">Blog</Link>
          </div>
          <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
            <h4 className="text-white font-semibold mb-2 text-[15px]">Legal</h4>
            <Link href="/privacy" className="text-white/60 hover:text-white text-[15px] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-white/60 hover:text-white text-[15px] transition-colors">Terms of Service</Link>
            <Link href="mailto:support@studflow.com" className="text-white/60 hover:text-white text-[15px] transition-colors">Contact</Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-20 mx-auto mt-24 pt-8 border-t border-[rgba(255,255,255,.05)] flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-white/40 text-[14px] font-light">
          © {new Date().getFullYear()} Studflow. All rights reserved.
        </p>
        <p className="text-white/40 text-[14px] font-light flex items-center gap-2">
          Designed for better learning <span className="text-[#4F7BFF]">✦</span>
        </p>
      </div>
    </footer>
  );
}
