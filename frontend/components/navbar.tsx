"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

import { ThemeSettings } from "@/components/theme/ThemeSettings";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Upload", href: "/upload" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--nav-height)",
        backgroundColor: "color-mix(in srgb, var(--background) 86%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        {!pathname.startsWith("/dashboard") ? (
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 700,
              fontSize: "1.125rem",
              letterSpacing: "-0.02em",
              color: "var(--distill-text-primary)",
            }}
          >
            <Image src="/studflow_logo.png" alt="Studflow Logo" width={28} height={28} priority />
            Studflow
          </Link>
        ) : (
          <div /> // Placeholder to keep flex-between spacing
        )}

        {/* Nav links */}
        <nav
          role="navigation"
          aria-label="Main navigation"
          style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
        >
          {isLoaded && isSignedIn ? (
            <>
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: "0.375rem 0.875rem",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: isActive
                      ? "var(--theme-primary)"
                      : "var(--distill-text-secondary)",
                    backgroundColor: isActive ? "var(--theme-soft)" : "transparent",
                    transition: "color var(--transition-fast), background-color var(--transition-fast)",
                  }}
                >
                  {label}
                </Link>
              );
            })}
            <div style={{ marginLeft: "0.75rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <ThemeSettings />
              <UserButton />
            </div>
            </>
          ) : null}

          {isLoaded && !isSignedIn ? (
            <>
            <Link
              href="/sign-in"
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--distill-text-secondary)",
              }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="btn-primary"
              style={{ marginLeft: "0.75rem" }}
            >
              Get Started
            </Link>
            <ThemeSettings />
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
