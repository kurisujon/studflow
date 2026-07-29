import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

type FeatureTone = "documents" | "summaries" | "quizzes" | "flashcards";

type DashboardFeatureShellProps = {
  tone: FeatureTone;
  eyebrow: string;
  title: string;
  description: string;
  count?: { value: number; label: string };
  action?: { href: string; label: string };
  children: ReactNode;
};

const toneClasses: Record<
  FeatureTone,
  { icon: string; glow: string; badge: string }
> = {
  documents: {
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    glow: "from-blue-500/10 via-sky-500/5",
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  summaries: {
    icon: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    glow: "from-amber-500/10 via-orange-500/5",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  quizzes: {
    icon: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    glow: "from-emerald-500/10 via-blue-500/5",
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  },
  flashcards: {
    icon: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    glow: "from-violet-500/10 via-indigo-500/5",
    badge:
      "border-violet-500/20 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  },
};

function FeatureIcon({
  tone,
  ...props
}: SVGProps<SVGSVGElement> & { tone: FeatureTone }) {
  const paths: Record<FeatureTone, string[]> = {
    documents: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      "M14 2v6h6",
      "M8 13h8",
      "M8 17h6",
    ],
    summaries: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      "M14 2v6h6",
      "M8 13h8",
      "M8 17h5",
    ],
    quizzes: [
      "M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4",
      "M12 18h.01",
      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
    ],
    flashcards: [
      "m2 12 10 5 10-5-10-5-10 5z",
      "m2 17 10 5 10-5",
      "m2 7 10-5 10 5",
    ],
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[tone].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

export function DashboardFeatureShell({
  tone,
  eyebrow,
  title,
  description,
  count,
  action,
  children,
}: DashboardFeatureShellProps) {
  const palette = toneClasses[tone];

  return (
    <div className="relative min-h-[calc(100dvh-var(--nav-height))] overflow-hidden">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-br ${palette.glow} to-transparent`}
      />
      <div className="relative mx-auto w-full max-w-[1440px] space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="relative overflow-hidden rounded-[28px] border border-[var(--theme-border)] bg-[var(--card)] p-5 shadow-[0_18px_50px_var(--theme-shadow)] sm:p-7">
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-2xl ${palette.icon}`}
              >
                <FeatureIcon tone={tone} aria-hidden="true" className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--theme-primary)]">
                  {eyebrow}
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                  {description}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3 pl-0 sm:pl-16 md:pl-0">
              {count ? (
                <span
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${palette.badge}`}
                >
                  {count.value} {count.label}
                </span>
              ) : null}
              {action ? (
                <Link
                  href={action.href}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
                >
                  {action.label}
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
