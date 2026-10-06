import Link from "next/link";
import { FileTextIcon as FileText, ArrowRightIcon as ArrowRight } from "@/components/home/icon-registry";
import { RetryDocumentButton } from "@/components/retry-document-button";
import type { DocumentListItem } from "@/lib/types";
import { stripExtension, formatDate } from "./utils";

function ReadinessChip({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
        ready
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-[var(--muted)] text-[var(--muted-foreground)]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${
          ready ? "bg-emerald-500" : "bg-[var(--border)]"
        }`}
      />
      {label}
    </span>
  );
}

export function DocumentFlowCard({ document }: { document: DocumentListItem }) {
  const completed = document.status === "COMPLETED";
  const failed = document.status === "FAILED";

  return (
    <article className="flex h-full min-h-[260px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:border-[var(--theme-primary)] hover:shadow-md group">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--theme-soft)] text-[var(--theme-primary)]">
          <FileText aria-hidden="true" className="size-5" />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
            completed
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : failed
                ? "bg-red-500/10 text-red-700 dark:text-red-300"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {completed ? "Ready" : failed ? "Error" : "Processing"}
        </span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-base font-bold text-[var(--foreground)] group-hover:text-[var(--theme-primary)] transition-colors">
        {stripExtension(document.filename)}
      </h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {formatDate(document.updated_at ?? document.created_at)}
        {document.page_count ? ` · ${document.page_count} pages` : ""}
      </p>

      {completed ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <ReadinessChip ready={document.summary_ready} label="Summary" />
          <ReadinessChip
            ready={document.flashcard_count > 0}
            label={`${document.flashcard_count} cards`}
          />
          <ReadinessChip ready={document.quiz_ready} label="Quiz" />
        </div>
      ) : failed ? (
        <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
          Processing failed. Retry to rebuild materials.
        </p>
      ) : (
        <div aria-live="polite" className="mt-4">
          <div aria-hidden="true" className="flex items-center gap-1.5">
            <span className="size-2 animate-pulse rounded-full bg-[var(--theme-primary)]" />
            <span className="size-2 animate-pulse rounded-full bg-[var(--theme-primary)] opacity-70" />
            <span className="size-2 animate-pulse rounded-full bg-[var(--theme-primary)] opacity-40" />
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            {document.status.charAt(0).toUpperCase() + document.status.slice(1).toLowerCase()}...
          </p>
        </div>
      )}

      <div className="mt-auto pt-5">
        {completed ? (
          <Link
            href={`/dashboard/study/${document.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--theme-soft)] px-4 py-2 text-sm font-semibold text-[var(--theme-primary)] transition hover:bg-[color-mix(in_srgb,var(--theme-primary)_15%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
          >
            Study
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : failed ? (
          <RetryDocumentButton documentId={document.id} />
        ) : (
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)] opacity-70"
          >
            Processing...
          </button>
        )}
      </div>
    </article>
  );
}
