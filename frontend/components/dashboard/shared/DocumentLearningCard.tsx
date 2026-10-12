import Link from "next/link";
import { ArrowRightIcon, BrainIcon, CircleHelpIcon, FileTextIcon, MessageCircleIcon, StickyNoteIcon } from "@/components/home/icon-registry";
import type { DocumentListItem } from "@/lib/types";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function DocumentLearningCard({ document, mode = "set" }: { document: DocumentListItem; mode?: "set" | "assistant" | "flashcards" | "quiz" }) {
  const ready = document.status === "COMPLETED";
  const href = mode === "assistant" ? `/dashboard/study/${document.id}?tab=summary&panel=ai` : mode === "flashcards" ? `/dashboard/study/${document.id}?tab=flashcards` : mode === "quiz" ? `/dashboard/study/${document.id}?tab=quiz` : `/dashboard/study/${document.id}`;
  return <article className="group flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-[var(--theme-border)] hover:shadow-sm">
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--theme-soft)] text-[var(--theme-primary)]"><FileTextIcon className="size-5" /></span><div className="min-w-0"><h2 className="line-clamp-2 font-bold leading-5 text-foreground" title={document.filename}>{document.filename}</h2><p className="mt-1 text-xs text-muted-foreground">Added {formatDate(document.created_at)}{document.page_count ? ` · ${document.page_count} pages` : ""}</p></div></div>
    <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1"><StickyNoteIcon className="size-3.5" />{document.summary_ready ? "Summary ready" : "Summary pending"}</span>
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1"><BrainIcon className="size-3.5" />{document.flashcard_count} cards</span>
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1"><CircleHelpIcon className="size-3.5" />{document.quiz_ready ? "Quiz ready" : "Quiz pending"}</span>
      {mode === "assistant" ? <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1"><MessageCircleIcon className="size-3.5" />Grounded chat</span> : null}
    </div>
    <div className="mt-auto pt-5">{ready ? <Link href={href} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition group-hover:border-[var(--theme-border)] group-hover:text-[var(--theme-primary)]">{mode === "assistant" ? "Open assistant" : mode === "flashcards" ? "Study cards" : mode === "quiz" ? "Start quiz" : "Open learning space"}<ArrowRightIcon className="size-4" /></Link> : <span className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-muted px-3 text-sm font-semibold text-muted-foreground">{document.status === "FAILED" ? "Processing failed" : "Processing material"}</span>}</div>
  </article>;
}
