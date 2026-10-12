import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center"><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--theme-primary)]">404</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Page not found</h1><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">The page may have moved, or the link may no longer be available.</p><Link href="/dashboard" className="mt-6 inline-flex min-h-10 items-center rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)]">Return to StudFlow</Link></main>;
}
