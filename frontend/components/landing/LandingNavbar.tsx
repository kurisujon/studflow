"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
// @ts-expect-error - lucide-react types are outdated in this project
import { Menu, X, ArrowRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { LandingContainer } from "./ui/LandingContainer";
import { LandingButton } from "./ui/LandingButton";

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
          ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-[#E2E8F0]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <LandingContainer variant="wide" className="flex items-center justify-between h-[80px]">
        <Link href="/" className="flex items-center gap-2.5 group">
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

        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <LandingButton href="/dashboard" variant="primary" size="md">
              Go to Dashboard
            </LandingButton>
          ) : (
            <>
              <LandingButton href="/sign-in" variant="ghost" size="md">
                Sign In
              </LandingButton>
              <LandingButton
                href="/sign-up"
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />}
              >
                Get Started
              </LandingButton>
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
      </LandingContainer>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-[#E2E8F0] md:hidden flex flex-col px-6 py-6 gap-6"
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
                <LandingButton
                  href="/dashboard"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Go to Dashboard
                </LandingButton>
              ) : (
                <>
                  <LandingButton
                    href="/sign-in"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </LandingButton>
                  <LandingButton
                    href="/sign-up"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    icon={<ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </LandingButton>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
