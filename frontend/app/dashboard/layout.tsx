"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FolderOpenIcon, 
  FileTextIcon, 
  StickyNoteIcon, 
  CircleHelpIcon 
} from "@/components/home/icon-registry";

const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: FolderOpenIcon },
  { label: "My Docs", href: "/dashboard/docs", icon: FileTextIcon },
  { label: "Study Plan", href: "/dashboard/study", icon: StickyNoteIcon },
  { label: "Settings", href: "/dashboard/settings", icon: CircleHelpIcon },
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
          width: "260px",
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--background)",
          padding: "2rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
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
      <main style={{ flex: 1, backgroundColor: "var(--background)" }}>
        {children}
      </main>
    </div>
  );
}
