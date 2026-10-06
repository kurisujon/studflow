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

  const sidebarStyle = {
    "--sidebar-width": `${sidebarWidth}px`,
  } as React.CSSProperties;

  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-height))] bg-[var(--background)]" style={sidebarStyle}>
      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        aria-label="Dashboard navigation"
        className="fixed z-[100] flex overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-[1px_0_40px_var(--theme-shadow)] sm:shadow-none
          max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:h-[68px] max-md:w-full max-md:flex-row max-md:items-center max-md:justify-around max-md:border-t max-md:px-2 max-md:py-2
          md:left-0 md:top-0 md:h-dvh md:w-[var(--sidebar-width)] md:flex-col md:gap-2 md:border-r md:px-3 md:py-6 md:transition-[width] md:duration-240 md:ease-out md:will-change-[width]"
      >
        {/* Logo / Branding */}
        <Link
          href="/"
          className="max-md:hidden mb-6 flex items-center justify-start gap-3 overflow-hidden whitespace-nowrap pl-2 text-[1.125rem] font-bold tracking-tight text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]"
        >
          <Image
            src="/studflow_logo.png"
            alt="Studflow Logo"
            width={28}
            height={28}
            priority
            className="shrink-0"
          />
          <span
            className="overflow-hidden whitespace-nowrap"
            style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : "160px",
              transition:
                "opacity 180ms cubic-bezier(0.4, 0, 0.2, 1), max-width 240ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            Studflow
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="flex w-full flex-1 gap-1 max-md:flex-row max-md:items-center max-md:justify-around md:flex-col" aria-label="Sidebar">
          {SIDEBAR_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={`
                  group flex items-center overflow-hidden whitespace-nowrap rounded-xl transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]
                  max-md:flex-col max-md:justify-center max-md:gap-1 max-md:px-2 max-md:py-2 max-md:flex-1 max-md:text-[0.7rem]
                  md:justify-start md:gap-3 md:p-3 md:text-[0.92rem]
                  ${
                    isActive
                      ? "bg-[color-mix(in_srgb,var(--theme-primary)_8%,transparent)] font-semibold text-[var(--theme-primary)] dark:bg-[color-mix(in_srgb,var(--theme-primary)_15%,transparent)]"
                      : "font-medium text-[var(--distill-text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  }
                `}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={`shrink-0 transition-colors duration-200 ${
                    isActive
                      ? "text-[var(--theme-primary)]"
                      : "text-[var(--distill-text-muted)] group-hover:text-[var(--foreground)]"
                  }`}
                />
                <span
                  className="overflow-hidden whitespace-nowrap max-md:opacity-100 max-md:!max-w-none md:transition-[opacity,max-width] md:duration-[180ms,240ms] md:ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? 0 : "160px",
                  }}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>
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
        className={`
          max-md:hidden fixed z-[110] size-8 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]
          ${
            collapsed
              ? "border border-[var(--border)] bg-[var(--card)] text-[var(--distill-text-secondary)] shadow-sm hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              : "bg-transparent text-[var(--distill-text-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          }
        `}
        style={{
          top: "calc((var(--nav-height) - 32px) / 2)",
          left: collapsed
            ? `${SIDEBAR_COLLAPSED_WIDTH - 16}px`
            : `${SIDEBAR_EXPANDED_WIDTH - 44}px`,
          transition:
            "left 240ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms, color 150ms",
        }}
      >
        <ChevronLeftIcon
          aria-hidden="true"
          size={16}
          strokeWidth={2}
          style={{
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 240ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Button>

      {/* Main Content */}
      <div
        className="flex min-w-0 flex-1 flex-col max-md:ml-0 max-md:w-full max-md:pb-[68px] md:ml-[var(--sidebar-width)] md:w-[calc(100%-var(--sidebar-width))] md:transition-[margin-left,width] md:duration-240 md:ease-out"
      >
        <div className="mx-auto w-full max-w-[1600px]">
          {children}
        </div>
      </div>
    </div>
  );
}
