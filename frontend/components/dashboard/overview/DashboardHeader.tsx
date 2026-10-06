import Link from "next/link";
import { SparklesIcon as Sparkles, ArrowRightIcon as ArrowRight, UploadIcon as Upload } from "@/components/home/icon-registry";

export function DashboardHeader({
  primaryAction,
}: {
  primaryAction: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="relative max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Welcome back to your studies
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Continue a document, clear today&apos;s reviews, or turn fresh notes
          into your next focused study session.
        </p>
      </div>
      <div className="flex shrink-0 flex-col sm:flex-row gap-3 w-full md:w-auto">
        <Link
          href="/dashboard/upload"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
        >
          <Upload aria-hidden="true" className="size-4" />
          Upload
        </Link>
        <Link
          href={primaryAction.href}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
        >
          {primaryAction.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
