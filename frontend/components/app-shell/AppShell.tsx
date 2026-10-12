"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRightIcon, FileTextIcon, MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SearchIcon, UploadIcon, XIcon } from "@/components/home/icon-registry";
import { ThemeSettings } from "@/components/theme/ThemeSettings";
import type { DocumentListItem } from "@/lib/types";
import { getPageLabel, isNavigationItemActive, navigationGroups } from "./navigation";

const SIDEBAR_KEY = "studflow-sidebar-collapsed";

export function AppShell({ children, documents }: { children: React.ReactNode; documents: DocumentListItem[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [desktopNavigation, setDesktopNavigation] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const appContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { if (window.localStorage.getItem(SIDEBAR_KEY) === "true") window.requestAnimationFrame(() => setCollapsed(true)); } catch {} }, []);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => { setDesktopNavigation(media.matches); if (media.matches) setMobileOpen(false); };
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => { window.requestAnimationFrame(() => { setMobileOpen(false); setSearchOpen(false); setQuery(""); }); }, [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : mobileTriggerRef.current;
    const contentNode = appContentRef.current;
    document.body.style.overflow = "hidden";
    contentNode?.setAttribute("inert", "");
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getVisibleFocusable = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []).filter((element) => {
      if (element.closest("[hidden], [inert]")) return false;
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    });
    requestAnimationFrame(() => getVisibleFocusable()[0]?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setMobileOpen(false); return; }
      if (event.key !== "Tab") return;
      const focusable = getVisibleFocusable();
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      contentNode?.removeAttribute("inert");
      requestAnimationFrame(() => returnFocus?.focus());
    };
  }, [mobileOpen]);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return (normalized ? documents.filter((item) => item.filename.toLocaleLowerCase().includes(normalized)) : documents).slice(0, 6);
  }, [documents, query]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try { window.localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
      return next;
    });
  }

  return (
    <div className="app-shell" data-sidebar-collapsed={collapsed ? "true" : "false"}>
      {mobileOpen ? <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] lg:hidden" aria-hidden="true" onClick={() => setMobileOpen(false)} /> : null}
      <aside ref={sidebarRef} id="app-sidebar" aria-label="Application navigation" role={desktopNavigation ? undefined : "dialog"} aria-modal={desktopNavigation ? undefined : true} inert={!desktopNavigation && !mobileOpen ? true : undefined} className={`app-sidebar ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex h-16 items-center gap-3 px-4">
          <Link href="/dashboard" aria-label="StudFlow dashboard" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Image src="/studflow_logo.png" alt="" width={30} height={30} priority className="shrink-0" />
            <span className="sidebar-copy truncate text-[15px] font-bold tracking-tight">StudFlow</span>
          </Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="ml-auto grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden" aria-label="Close navigation"><XIcon className="size-5" /></button>
        </div>
        <div className="px-3 pb-3"><Link href="/upload" aria-label="Upload material" className="sidebar-upload"><UploadIcon className="size-4 shrink-0" aria-hidden="true" /><span className="sidebar-copy">Upload material</span></Link></div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
          {navigationGroups.map((group) => <div key={group.label} className="mb-5">
            <p className="sidebar-copy mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">{group.label}</p>
            <div className="space-y-0.5">{group.items.map((item) => {
              const active = isNavigationItemActive(pathname, item.href); const Icon = item.icon;
              return <Link key={item.href} href={item.href} aria-label={item.label} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}><Icon className="size-[18px] shrink-0" aria-hidden="true" /><span className="sidebar-copy truncate">{item.label}</span></Link>;
            })}</div>
          </div>)}
        </nav>
        <div className="hidden border-t border-border p-3 lg:block"><button type="button" onClick={toggleCollapsed} className="sidebar-link w-full" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpenIcon className="size-[18px] shrink-0" /> : <PanelLeftCloseIcon className="size-[18px] shrink-0" />}<span className="sidebar-copy">Collapse sidebar</span></button></div>
      </aside>

      <div ref={appContentRef} className="app-content">
        <header className="app-header">
          <button ref={mobileTriggerRef} type="button" className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden" aria-label="Open navigation" aria-controls="app-sidebar" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><MenuIcon className="size-5" /></button>
          <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex"><span className="text-muted-foreground">Workspace</span><ChevronRightIcon className="size-3.5 text-muted-foreground/60" aria-hidden="true" /><span className="truncate font-semibold text-foreground">{getPageLabel(pathname)}</span></div>
          <div ref={searchRef} className="relative ml-auto min-w-0 flex-1 sm:w-full sm:max-w-sm sm:flex-none">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input type="search" value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} placeholder="Search your materials" aria-label="Search learning materials" className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]" />
            {searchOpen ? <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-full min-w-[280px] overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl">
              <p className="px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Materials</p>
              {results.length ? results.map((item) => <Link key={item.id} href={item.status === "COMPLETED" ? `/dashboard/study/${item.id}` : "/dashboard/docs"} className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)]"><FileTextIcon className="size-4" /></span><span className="min-w-0 flex-1 truncate font-medium">{item.filename}</span><span className="text-[10px] font-semibold text-muted-foreground">{item.status === "COMPLETED" ? "Ready" : item.status}</span></Link>) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matching materials</p>}
            </div> : null}
          </div>
          <Link href="/upload" className="hidden h-10 shrink-0 items-center gap-2 rounded-xl bg-[var(--theme-primary)] px-3.5 text-sm font-semibold text-[var(--theme-on-primary)] shadow-sm transition hover:bg-[var(--theme-primary-hover)] md:inline-flex"><UploadIcon className="size-4" aria-hidden="true" />Upload</Link>
          <ThemeSettings /><UserButton />
        </header>
        <main id="main-content" className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
