"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

export function LandingNavbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "AI Study Assistant", href: "#demo" },
    { label: "Reviews", href: "#reviews" },
    { label: "Pricing (Coming Soon)", href: "#" },
    { label: "About", href: "#about" },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-6 transition-all duration-300 ${
        isScrolled 
          ? "bg-background/85 backdrop-blur-md border-b border-border shadow-sm" 
          : "bg-transparent border-b border-transparent"
      }`}
      style={{ height: "72px" }}
    >
      <div className="w-full max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <Image src="/studflow_logo.png" alt="Studflow Logo" width={28} height={28} priority />
          Studflow
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => (
            <Link 
              key={link.label} 
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="hidden sm:block text-sm font-medium text-foreground hover:text-primary transition-colors">
            Login
          </Link>
          <Link 
            href="/sign-up" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-[12px] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
