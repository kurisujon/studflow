import {
  BookMarkedIcon, BrainIcon, CalendarCheckIcon, ChartNoAxesColumnIncreasingIcon,
  CircleHelpIcon, HomeIcon, LibraryIcon, MessagesSquareIcon, SettingsIcon, StickyNoteIcon,
} from "@/components/home/icon-registry";

export const navigationGroups = [
  { label: "Workspace", items: [
    { label: "Overview", href: "/dashboard", icon: HomeIcon },
    { label: "My Library", href: "/dashboard/docs", icon: LibraryIcon },
    { label: "Study Sets", href: "/dashboard/study-sets", icon: BookMarkedIcon },
  ] },
  { label: "Learning", items: [
    { label: "AI Study Assistant", href: "/dashboard/assistant", icon: MessagesSquareIcon },
    { label: "Summaries & Notes", href: "/dashboard/summaries", icon: StickyNoteIcon },
    { label: "Flashcards", href: "/dashboard/flashcards", icon: BrainIcon },
    { label: "Practice & Quizzes", href: "/dashboard/quizzes", icon: CircleHelpIcon },
    { label: "Daily Review", href: "/dashboard/review", icon: CalendarCheckIcon },
  ] },
  { label: "Progress & account", items: [
    { label: "My Progress", href: "/dashboard/progress", icon: ChartNoAxesColumnIncreasingIcon },
    { label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
  ] },
] as const;

export const routeLabels: Record<string, string> = Object.fromEntries(
  navigationGroups.flatMap((group) => group.items.map((item) => [item.href, item.label])),
);

export function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPageLabel(pathname: string) {
  if (pathname.startsWith("/dashboard/study/")) return "Study workspace";
  if (pathname === "/upload") return "Upload material";
  return routeLabels[pathname] ?? "StudFlow";
}
