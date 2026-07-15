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
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 transition-all duration-300 ${
          isScrolled 
            ? "bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20 py-3" 
            : "bg-transparent border-b border-transparent py-5"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-white">
            <Image src="/studflow_logo.png" alt="Studflow Logo" width={28} height={28} priority />
            Studflow
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/sign-in" 
              className="text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2"
            >
              Login
            </Link>
            <Link 
              href="/sign-up" 
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-white/70 hover:text-white"
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
            className="fixed inset-x-0 top-[70px] z-40 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-white/5 md:hidden"
          >
            <div className="flex flex-col p-4 space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px w-full bg-white/10 my-2" />
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
                className="w-full py-3 mt-2 text-center bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-indigo-500/20"
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
