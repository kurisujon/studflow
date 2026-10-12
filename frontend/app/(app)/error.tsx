"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircleIcon, RotateCcwIcon } from "@/components/home/icon-registry";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <section className="mx-auto flex min-h-[calc(100dvh-var(--nav-height))] max-w-xl flex-col items-center justify-center px-6 py-16 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-red-500/10 text-red-600"><AlertCircleIcon className="size-6" /></span><h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">This workspace view could not load</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">The request failed before StudFlow could show this page. Retry the request or return to your library.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)]"><RotateCcwIcon className="size-4" />Try again</button><Link href="/dashboard/docs" className="inline-flex min-h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground">Open library</Link></div></section>;
}
