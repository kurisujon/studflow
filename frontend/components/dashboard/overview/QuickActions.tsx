import Link from "next/link";
import { UploadIcon as Upload, FileTextIcon as FileText, BrainIcon as Brain, BookOpenIcon as BookOpen, ArrowRightIcon as ArrowRight } from "@/components/home/icon-registry";

export function QuickActions() {
  const actions = [
    { href: "/dashboard/upload", label: "Upload document", icon: Upload },
    { href: "/dashboard/docs", label: "Browse documents", icon: FileText },
    { href: "/dashboard/flashcards", label: "Review flashcards", icon: Brain },
    { href: "/dashboard/quizzes", label: "Practice quizzes", icon: BookOpen },
  ];

  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="flex flex-col rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 id="quick-actions-heading" className="text-lg font-bold text-[var(--foreground)]">
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Jump straight to your learning tools.
        </p>
      </div>

      <ul className="grid gap-2">
        {actions.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-12 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--theme-primary)] hover:bg-[color-mix(in_srgb,var(--theme-primary)_3%,transparent)] hover:text-[var(--theme-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)]">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="flex-1 truncate">{label}</span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
