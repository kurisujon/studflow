"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
// @ts-expect-error - lucide-react types are outdated in this project
import { Menu, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Benefits", href: "#benefits" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.05)] py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="w-full px-5 md:px-12 lg:px-24 mx-auto max-w-[1440px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/studflow_logo.png" alt="StudFlow Logo" width={32} height={32} priority />
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">
            StudFlow
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-medium text-[#64748B] hover:text-[#168BFF] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-full text-[15px] font-semibold text-white bg-gradient-to-r from-[#168BFF] to-[#2563EB] hover:shadow-lg hover:shadow-[#168BFF]/30 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-5 py-2.5 text-[15px] font-semibold text-[#0F172A] hover:text-[#168BFF] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-6 py-2.5 rounded-full text-[15px] font-semibold text-white bg-[#0F172A] hover:bg-[#168BFF] hover:shadow-lg hover:shadow-[#168BFF]/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-[#0F172A]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-[#E2E8F0] md:hidden flex flex-col px-5 py-6 gap-6"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-lg font-medium text-[#0F172A] hover:text-[#168BFF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-3 pt-4 border-t border-[#E2E8F0]">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="w-full py-3 rounded-xl text-center font-semibold text-white bg-gradient-to-r from-[#168BFF] to-[#2563EB]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="w-full py-3 rounded-xl text-center font-semibold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="w-full py-3 rounded-xl text-center font-semibold text-white bg-[#0F172A]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
