"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDownIcon, FileTextIcon, Grid2X2Icon, ListIcon, SearchIcon, UploadIcon } from "@/components/home/icon-registry";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import { PageContainer, PageHeader } from "@/components/dashboard/shared/PageHeader";
import { RetryDocumentButton } from "@/components/retry-document-button";
import type { DocumentListItem } from "@/lib/types";

type Filter = "all" | "ready" | "processing" | "failed";
type Sort = "newest" | "oldest" | "name";
type View = "list" | "grid";

function processing(item: DocumentListItem) { return item.status !== "COMPLETED" && item.status !== "FAILED"; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Unknown date" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date); }

export function DocumentListView({ documents }: { documents: DocumentListItem[] }) {
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState<Filter>("all"); const [sort, setSort] = useState<Sort>("newest"); const [view, setView] = useState<View>("list"); const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const visible = useMemo(() => documents.filter((item) => !removed.has(item.id)).filter((item) => item.filename.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).filter((item) => filter === "all" || (filter === "ready" && item.status === "COMPLETED") || (filter === "failed" && item.status === "FAILED") || (filter === "processing" && processing(item))).sort((a,b) => sort === "name" ? a.filename.localeCompare(b.filename) : sort === "oldest" ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime() : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [documents, filter, query, removed, sort]);
  const counts = { all: documents.length - removed.size, ready: documents.filter((item) => item.status === "COMPLETED" && !removed.has(item.id)).length, processing: documents.filter((item) => processing(item) && !removed.has(item.id)).length, failed: documents.filter((item) => item.status === "FAILED" && !removed.has(item.id)).length };

  return <PageContainer><PageHeader eyebrow="Source materials" title="My Library" description="Find, filter, and open every uploaded learning material from one place." action={{ href: "/upload", label: "Upload material" }} />
    <section className="rounded-2xl border border-border bg-card p-3 sm:p-4" aria-label="Library controls"><div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <label className="relative min-w-0 flex-1"><span className="sr-only">Search by filename</span><SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by filename" className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]" /></label>
      <div className="flex min-w-0 gap-1 overflow-x-auto" aria-label="Filter documents">{(["all","ready","processing","failed"] as Filter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-semibold capitalize ${filter === value ? "bg-[var(--theme-soft)] text-[var(--theme-primary)]" : "text-muted-foreground hover:bg-muted"}`}>{value} <span className="ml-1 opacity-70">{counts[value]}</span></button>)}</div>
      <label className="relative"><span className="sr-only">Sort materials</span><ArrowUpDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="h-10 rounded-xl border border-border bg-background pl-9 pr-8 text-sm font-medium outline-none"><option value="newest">Recently updated</option><option value="oldest">Oldest first</option><option value="name">Filename</option></select></label>
      <div className="flex rounded-xl border border-border bg-background p-1"><button type="button" className={`grid size-8 place-items-center rounded-lg ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`} onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"}><ListIcon className="size-4" /></button><button type="button" className={`grid size-8 place-items-center rounded-lg ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`} onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"}><Grid2X2Icon className="size-4" /></button></div>
    </div></section>
    {visible.length ? <section className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "overflow-hidden rounded-2xl border border-border bg-card"} aria-label="Learning materials">{visible.map((item) => <DocumentRow key={item.id} document={item} grid={view === "grid"} onDelete={(id) => setRemoved((current) => new Set(current).add(id))} />)}</section> : <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center"><FileTextIcon className="size-7 text-muted-foreground" /><h2 className="mt-3 font-bold text-foreground">No materials found</h2><p className="mt-1 text-sm text-muted-foreground">Adjust your search or filter, or upload a new document.</p><Link href="/upload" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)]"><UploadIcon className="size-4" />Upload material</Link></section>}
  </PageContainer>;
}

function DocumentRow({ document, grid, onDelete }: { document: DocumentListItem; grid: boolean; onDelete: (id: string) => void }) {
  const ready = document.status === "COMPLETED"; const failed = document.status === "FAILED";
  return <article className={`${grid ? "flex flex-col rounded-2xl border border-border bg-card p-5" : "flex flex-col gap-4 border-b border-border p-4 last:border-0 sm:flex-row sm:items-center"} group min-w-0 hover:bg-muted/30`}>
    <div className="flex min-w-0 flex-1 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--theme-soft)] text-[var(--theme-primary)]"><FileTextIcon className="size-5" /></span><div className="min-w-0"><h2 className="truncate text-sm font-bold text-foreground" title={document.filename}>{document.filename}</h2><p className="mt-1 text-xs text-muted-foreground">{formatDate(document.updated_at)}{document.page_count ? ` · ${document.page_count} pages` : ""}</p></div></div>
    <div className={`${grid ? "mt-5" : "sm:w-28"}`}><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ready ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : failed ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}><span className={`size-1.5 rounded-full ${ready ? "bg-emerald-500" : failed ? "bg-red-500" : "animate-pulse bg-amber-500"}`} />{ready ? "Ready" : failed ? "Failed" : "Processing"}</span></div>
    <div className={`${grid ? "mt-4" : ""} flex items-center gap-2`}>{ready ? <Link href={`/dashboard/study/${document.id}`} className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-[var(--theme-primary)] px-3 text-xs font-bold text-[var(--theme-on-primary)]">Open</Link> : failed ? <RetryDocumentButton documentId={document.id} variant="icon" /> : <span className="text-xs text-muted-foreground">Study tools pending</span>}{ready || failed ? <DeleteDocumentButton documentId={document.id} filename={document.filename} onSuccess={onDelete} variant="icon" /> : null}</div>
  </article>;
}
