"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
// @ts-expect-error - lucide-react types are outdated in this project
import { Menu, X, ArrowRight } from "lucide-react";
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
          ? "bg-white/70 backdrop-blur-xl shadow-sm border-b border-[#E2E8F0]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10 lg:px-12 flex items-center justify-between h-[80px]">
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
              className="group relative flex items-center justify-center gap-1.5 h-11 px-6 rounded-xl text-[14px] font-bold text-white bg-gradient-to-r from-[#5964FF] to-[#8640FF] shadow-md hover:shadow-lg hover:shadow-[#8640FF]/30 transition-all duration-300 ease-out hover:-translate-y-1.5 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-[#4F46E5] h-11 px-6 flex items-center justify-center text-sm font-semibold hover:text-[#4338CA] transition-colors duration-300 ease-out transform hover:-translate-y-1"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="group relative flex shrink-0 items-center justify-center gap-1.5 h-11 px-6 rounded-xl text-[14px] font-bold text-white bg-gradient-to-r from-[#5964FF] to-[#8640FF] shadow-md hover:shadow-lg hover:shadow-[#8640FF]/30 transition-all duration-300 ease-out hover:-translate-y-1.5 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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
                  className="group relative flex items-center justify-center gap-1.5 w-full h-12 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-[#5964FF] to-[#8640FF] shadow-md hover:shadow-lg hover:shadow-[#8640FF]/30 transition-all duration-300 ease-out hover:-translate-y-1.5 overflow-hidden"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-[#4F46E5] w-full h-12 rounded-md flex items-center justify-center text-sm font-semibold bg-[#F8FAFC] border border-[#E2E8F0] transition-all duration-300 ease-out transform hover:-translate-y-1 hover:text-[#4338CA]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="group relative flex shrink-0 items-center justify-center gap-1.5 w-full h-12 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-[#5964FF] to-[#8640FF] shadow-md hover:shadow-lg hover:shadow-[#8640FF]/30 transition-all duration-300 ease-out hover:-translate-y-1.5 overflow-hidden"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    Get Started
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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
