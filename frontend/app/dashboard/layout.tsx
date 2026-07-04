"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  FolderOpenIcon, 
  FileTextIcon, 
  StickyNoteIcon, 
  CircleHelpIcon,
  LayersIcon
} from "@/components/home/icon-registry";

const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: FolderOpenIcon },
  { label: "Documents", href: "/dashboard/docs", icon: FileTextIcon },
  { label: "Summaries", href: "/dashboard/summaries", icon: StickyNoteIcon },
  { label: "Quizzes", href: "/dashboard/quizzes", icon: CircleHelpIcon },
  { label: "Flashcards", href: "/dashboard/flashcards", icon: LayersIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "calc(100dvh - var(--nav-height))" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--background)",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 100,
        }}
      >
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
            marginBottom: "1.5rem",
            paddingLeft: "0.5rem"
          }}
        >
          <Image src="/studflow_logo.png" alt="Studflow Logo" width={28} height={28} priority />
          Studflow
        </Link>
        {SIDEBAR_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                color: isActive ? "var(--theme-primary)" : "var(--distill-text-secondary)",
                backgroundColor: isActive ? "color-mix(in srgb, var(--theme-soft) 60%, transparent)" : "transparent",
                fontWeight: isActive ? 600 : 500,
                fontSize: "0.92rem",
                transition: "all var(--transition-fast)",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              {link.label}
            </Link>
          );
        })}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: "var(--background)", marginLeft: "220px", width: "calc(100% - 220px)" }}>
        {children}
      </main>
    </div>
  );
}
