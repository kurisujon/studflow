"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
const { Menu, X } = Lucide as unknown as Record<string, React.ElementType>;

export function LandingNavbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "AI Tutor", href: "#features" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${
          isScrolled 
            ? "bg-[#1f2233]/40 backdrop-blur-[24px] border-b border-white/[0.06] shadow-lg shadow-black/20 py-6 md:py-8" 
            : "bg-transparent border-b border-transparent py-10 md:py-12"
        }`}
      >
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 font-semibold text-xl text-white hover:opacity-90 transition-opacity">
            <Image src="/studflow_logo.png" alt="Studflow Logo" width={32} height={32} priority className="drop-shadow-md" />
            Studflow
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href}
                className="group relative text-[15px] font-medium text-white/80 hover:text-[#4F7BFF] transition-colors duration-300"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#4F7BFF] transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-10">
            <Link 
              href="/sign-in" 
              className="text-[18px] font-medium text-white/80 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/sign-up" 
              className="px-10 py-4 bg-gradient-to-r from-[#4F7BFF] to-[#7C5CFF] text-white text-[18px] font-semibold rounded-full hover:-translate-y-0.5 transition-transform shadow-[0_0_20px_rgba(79,123,255,0.25)] hover:shadow-[0_0_30px_rgba(79,123,255,0.4)] whitespace-nowrap"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[70px] z-40 bg-[#080C19]/95 backdrop-blur-[18px] border-b border-white/[0.06] md:hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-white/80 hover:text-[#4F7BFF] p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px w-full bg-white/[0.06] my-2" />
              <Link 
                href="/sign-in" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/sign-up" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 mt-2 text-center bg-gradient-to-r from-[#4F7BFF] to-[#7C5CFF] text-white text-base font-semibold rounded-full shadow-[0_0_20px_rgba(79,123,255,0.25)]"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
