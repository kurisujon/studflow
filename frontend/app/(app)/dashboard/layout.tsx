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
import { Button } from "@/components/ui/button";

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
        id="dashboard-sidebar"
        aria-label="Dashboard navigation"
        style={{
          width: `${sidebarWidth}px`,
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--background)",
          padding: "1.5rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 100,
          overflow: "hidden",
          transition: "width 240ms cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "width",
        }}
      >
        {/* Logo / Branding */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "0.75rem",
            fontWeight: 700,
            fontSize: "1.125rem",
            letterSpacing: "-0.02em",
            color: "var(--distill-text-primary)",
            marginBottom: "1rem",
            paddingLeft: "0.5rem",
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "opacity 240ms cubic-bezier(0.4, 0, 0.2, 1)",
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
                justifyContent: "flex-start",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "12px",
                color: isActive ? "var(--theme-primary)" : "var(--distill-text-secondary)",
                backgroundColor: isActive
                  ? "color-mix(in srgb, var(--theme-soft) 60%, transparent)"
                  : "transparent",
                fontWeight: isActive ? 600 : 500,
                fontSize: "0.92rem",
                transition: "all var(--transition-fast)",
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

      </aside>

      <Button
        type="button"
        variant={collapsed ? "outline" : "ghost"}
        size="icon"
        onClick={() => setCollapsed((current) => !current)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-controls="dashboard-sidebar"
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={
          collapsed
            ? "size-8 rounded-full bg-background shadow-sm"
            : "size-8 rounded-lg"
        }
        style={{
          position: "fixed",
          top: "calc((var(--nav-height) - 32px) / 2)",
          left: collapsed
            ? `${SIDEBAR_COLLAPSED_WIDTH - 16}px`
            : `${SIDEBAR_EXPANDED_WIDTH - 44}px`,
          zIndex: 110,
          color: "var(--distill-text-muted)",
          transition:
            "left 240ms cubic-bezier(0.4, 0, 0.2, 1), color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast)",
        }}
      >
        <ChevronLeftIcon
          aria-hidden="true"
          size={18}
          strokeWidth={1.8}
          style={{
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 240ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Button>

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
