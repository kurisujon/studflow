"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Upload", href: "/upload" },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--nav-height)",
        backgroundColor: "rgba(249, 249, 248, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--distill-border)",
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
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: "1.0625rem",
            letterSpacing: "-0.03em",
            color: "var(--distill-text-primary)",
          }}
        >
          Distill
        </Link>

        {/* Nav links */}
        <nav
          role="navigation"
          aria-label="Main navigation"
          style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
        >
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
                    ? "var(--distill-text-primary)"
                    : "var(--distill-text-secondary)",
                  backgroundColor: isActive ? "var(--distill-border)" : "transparent",
                  transition: "color var(--transition-fast), background-color var(--transition-fast)",
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* CTA */}
          <a
            href="/upload"
            className="btn-primary"
            style={{ marginLeft: "0.75rem" }}
          >
            Get Started
          </a>
        </nav>
      </div>
    </header>
  );
}

