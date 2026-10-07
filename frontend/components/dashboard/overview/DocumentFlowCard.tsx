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
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
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
    <article className="group flex items-center justify-between gap-4 rounded-xl border border-transparent py-3 px-3 transition-colors hover:border-[var(--border)] hover:bg-[var(--muted)/30] sm:px-4">
      <div className="flex items-center gap-4 min-w-0">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)]">
          <FileText aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--theme-primary)] transition-colors">
              {stripExtension(document.filename)}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                completed
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : failed
                    ? "bg-red-500/10 text-red-700 dark:text-red-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }`}
            >
              {completed ? "Ready" : failed ? "Error" : "Processing"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
            {formatDate(document.updated_at ?? document.created_at)}
            {document.page_count ? ` · ${document.page_count} pages` : ""}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {completed && (
           <div className="hidden lg:flex items-center gap-2 mr-2">
             <ReadinessChip ready={document.summary_ready} label="Summary" />
             <ReadinessChip ready={document.flashcard_count > 0} label={`${document.flashcard_count} cards`} />
             <ReadinessChip ready={document.quiz_ready} label="Quiz" />
           </div>
        )}

        {completed ? (
          <Link
            href={`/dashboard/study/${document.id}`}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[var(--theme-soft)] px-3 text-xs font-semibold text-[var(--theme-primary)] opacity-100 sm:opacity-0 transition-all sm:group-hover:opacity-100 hover:bg-[var(--theme-primary)] hover:text-white focus-visible:opacity-100"
          >
            Study
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        ) : failed ? (
          <div className="opacity-100 sm:opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
             <RetryDocumentButton documentId={document.id} />
          </div>
        ) : (
          <div className="flex items-center gap-2 pr-2 text-xs text-[var(--muted-foreground)]">
             <span className="flex gap-1">
               <span className="size-1.5 animate-pulse rounded-full bg-[var(--theme-primary)]" />
               <span className="size-1.5 animate-pulse rounded-full bg-[var(--theme-primary)] opacity-70" />
               <span className="size-1.5 animate-pulse rounded-full bg-[var(--theme-primary)] opacity-40" />
             </span>
          </div>
        )}
      </div>
    </article>
  );
}
