"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FolderOpenIcon,
  FileTextIcon,
  StickyNoteIcon,
  CircleHelpIcon,
  LayersIcon,
  ChevronLeftIcon,
} from "@/components/home/icon-registry";

const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: FolderOpenIcon },
  { label: "Documents", href: "/dashboard/docs", icon: FileTextIcon },
  { label: "Summaries", href: "/dashboard/summaries", icon: StickyNoteIcon },
  { label: "Quizzes", href: "/dashboard/quizzes", icon: CircleHelpIcon },
  { label: "Flashcards", href: "/dashboard/flashcards", icon: LayersIcon },
];

const SIDEBAR_EXPANDED_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 64;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <div style={{ display: "flex", minHeight: "calc(100dvh - var(--nav-height))" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: `${sidebarWidth}px`,
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--background)",
          padding: collapsed ? "1.5rem 0" : "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 100,
          overflow: "hidden",
          transition: "width 240ms cubic-bezier(0.4, 0, 0.2, 1), padding 240ms cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "width",
        }}
      >
        {/* Logo / Branding */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "0.5rem",
            fontWeight: 700,
            fontSize: "1.125rem",
            letterSpacing: "-0.02em",
            color: "var(--distill-text-primary)",
            marginBottom: "1rem",
            paddingLeft: collapsed ? 0 : "0.5rem",
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "padding-left 240ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Image
            src="/studflow_logo.png"
            alt="Studflow Logo"
            width={28}
            height={28}
            priority
            style={{ flexShrink: 0 }}
          />
          <span
            style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : "160px",
              overflow: "hidden",
              transition: "opacity 180ms cubic-bezier(0.4, 0, 0.2, 1), max-width 240ms cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
            }}
          >
            Studflow
          </span>
        </Link>

        {/* Navigation links */}
        {SIDEBAR_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: "0.75rem",
                padding: collapsed ? "0.75rem" : "0.75rem 1rem",
                borderRadius: "12px",
                color: isActive ? "var(--theme-primary)" : "var(--distill-text-secondary)",
                backgroundColor: isActive
                  ? "color-mix(in srgb, var(--theme-soft) 60%, transparent)"
                  : "transparent",
                fontWeight: isActive ? 600 : 500,
                fontSize: "0.92rem",
                transition:
                  "all var(--transition-fast), justify-content 240ms cubic-bezier(0.4, 0, 0.2, 1), padding 240ms cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
              <span
                style={{
                  opacity: collapsed ? 0 : 1,
                  maxWidth: collapsed ? 0 : "160px",
                  overflow: "hidden",
                  transition:
                    "opacity 180ms cubic-bezier(0.4, 0, 0.2, 1), max-width 240ms cubic-bezier(0.4, 0, 0.2, 1)",
                  whiteSpace: "nowrap",
                }}
              >
                {link.label}
              </span>
            </Link>
          );
        })}

        {/* Collapse toggle — pinned to bottom */}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "0.75rem",
            padding: collapsed ? "0.75rem" : "0.75rem 1rem",
            borderRadius: "12px",
            color: "var(--distill-text-muted)",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "0.92rem",
            fontWeight: 500,
            width: "100%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition:
              "color var(--transition-fast), background-color var(--transition-fast), padding 240ms cubic-bezier(0.4, 0, 0.2, 1), justify-content 240ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--distill-text-primary)";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "color-mix(in srgb, var(--border) 60%, transparent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--distill-text-muted)";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
        >
          <ChevronLeftIcon
            size={18}
            strokeWidth={1.8}
            style={{
              flexShrink: 0,
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 240ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <span
            style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : "160px",
              overflow: "hidden",
              transition:
                "opacity 180ms cubic-bezier(0.4, 0, 0.2, 1), max-width 240ms cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
            }}
          >
            Collapse
          </span>
        </button>
      </aside>

      {/* Main Content — shifts in sync with sidebar width */}
      <main
        style={{
          flex: 1,
          backgroundColor: "var(--background)",
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition:
            "margin-left 240ms cubic-bezier(0.4, 0, 0.2, 1), width 240ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
