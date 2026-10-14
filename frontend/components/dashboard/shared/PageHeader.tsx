import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action, aside }: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--theme-primary)]">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">{aside}{action ? <Link href={action.href} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)] shadow-sm transition hover:bg-[var(--theme-primary-hover)]">{action.label}</Link> : null}</div>
    </header>
  );
}

export function PageContainer({ children, width = "wide" }: { children: ReactNode; width?: "wide" | "reading" }) {
  return <div className={`mx-auto w-full ${width === "reading" ? "max-w-[1080px]" : "max-w-[1400px]"} space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8`}>{children}</div>;
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex items-end justify-between gap-4"><div><h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">{title}</h2>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>{action}</div>;
}
