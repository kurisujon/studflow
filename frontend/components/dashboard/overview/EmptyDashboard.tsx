import Link from "next/link";
import { UploadIcon as Upload } from "@/components/home/icon-registry";

export function EmptyDashboard() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-sm px-6 py-12 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-[var(--theme-soft)] text-[var(--theme-primary)]">
        <Upload aria-hidden="true" className="size-8" />
      </div>
      <h3 className="mt-6 text-xl font-bold tracking-tight text-[var(--foreground)]">
        No documents yet
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
        Upload your first lecture, syllabus, or reading assignment to start generating smart flashcards and quizzes automatically.
      </p>
      <Link
        href="/dashboard/upload"
        className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        Upload your first document
      </Link>
    </div>
  );
}
