"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";
import type { SummaryLibraryItem } from "@/lib/types";

type DateFilter = "all" | "recent";
type SortOrder = "newest" | "oldest";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isRecent(value: string) {
  return new Date(value).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000;
}

function searchableText(summary: SummaryLibraryItem) {
  return [
    summary.filename,
    summary.overview,
    ...summary.topics,
    ...summary.key_takeaways,
    ...summary.important_terms,
  ].join(" ").toLowerCase();
}

export function SummaryLibraryView({ summaries }: { summaries: SummaryLibraryItem[] }) {
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const normalizedQuery = query.trim().toLowerCase();
  const defaultView = !normalizedQuery && dateFilter === "all" && sortOrder === "newest";

  const orderedSummaries = useMemo(() => {
    return [...summaries].sort((left, right) => {
      const difference = new Date(right.summary_created_at).getTime() - new Date(left.summary_created_at).getTime();
      return sortOrder === "newest" ? difference : -difference;
    });
  }, [sortOrder, summaries]);

  const latestSummary = defaultView ? orderedSummaries[0] : undefined;
  const matchingSummaries = orderedSummaries.filter((summary) => {
    if (dateFilter === "recent" && !isRecent(summary.summary_created_at)) return false;
    if (normalizedQuery && !searchableText(summary).includes(normalizedQuery)) return false;
    return true;
  });
  const filteredSummaries = latestSummary
    ? matchingSummaries.filter((summary) => summary.document_id !== latestSummary.document_id)
    : matchingSummaries;

  return (
    <DashboardFeatureShell
      tone="summaries"
      eyebrow="Generated study notes"
      title="Summary library"
      description="Browse structured AI-generated overviews and return to the complete reader when you are ready to study."
      count={{ value: summaries.length, label: summaries.length === 1 ? "summary" : "summaries" }}
      action={{ href: "/dashboard/docs", label: "View documents" }}
    >
      {summaries.length === 0 ? <EmptyLibrary /> : (
        <div className="space-y-6">
          {latestSummary ? <FeaturedSummary summary={latestSummary} /> : null}
          <SummaryToolbar
            query={query}
            onQueryChange={setQuery}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            resultCount={matchingSummaries.length}
          />
          {filteredSummaries.length > 0 ? (
            <ul className="flex flex-col rounded-xl border border-[var(--theme-border)] bg-[var(--card)] shadow-sm">
              {filteredSummaries.map((summary) => (
                <li key={summary.document_id} className="border-b border-[var(--theme-border)] last:border-0"><SummaryRow summary={summary} /></li>
              ))}
            </ul>
          ) : latestSummary ? (
            <p className="rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              Your latest summary is featured above. More summaries will appear here as documents finish processing.
            </p>
          ) : (
            <NoMatches />
          )}
        </div>
      )}
    </DashboardFeatureShell>
  );
}

function SummaryToolbar({
  query,
  onQueryChange,
  dateFilter,
  onDateFilterChange,
  sortOrder,
  onSortOrderChange,
  resultCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (value: DateFilter) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  resultCount: number;
}) {
  return (
    <section aria-labelledby="summary-browser-title" className="rounded-xl border border-[var(--theme-border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-xl">
          <label htmlFor="summary-search" className="text-sm font-semibold text-[var(--foreground)]">Search summaries</label>
          <input
            id="summary-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search titles, topics, takeaways, or terms"
            className="mt-2 min-h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[var(--foreground)]">Created</legend>
            <div className="flex gap-2">
              {(["all", "recent"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={dateFilter === value}
                  onClick={() => onDateFilterChange(value)}
                  className={`min-h-10 rounded-full border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${dateFilter === value ? "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300" : "border-[var(--theme-border)] text-[var(--muted-foreground)] hover:border-amber-500"}`}
                >
                  {value === "all" ? "All" : "Recent (30 days)"}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Sort
            <select
              value={sortOrder}
              onChange={(event) => onSortOrderChange(event.target.value as SortOrder)}
              className="mt-2 block min-h-10 rounded-xl border border-[var(--theme-border)] bg-[var(--background)] px-3 text-sm font-normal text-[var(--foreground)] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--theme-border)] pt-4">
        <h2 id="summary-browser-title" className="text-lg font-bold text-[var(--foreground)]">Browse your summaries</h2>
        <p aria-live="polite" className="text-sm text-[var(--muted-foreground)]">{resultCount} {resultCount === 1 ? "result" : "results"}</p>
      </div>
    </section>
  );
}

function FeaturedSummary({ summary }: { summary: SummaryLibraryItem }) {
  return (
    <article className="rounded-xl border border-[var(--theme-border)] bg-[var(--card)] p-5 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Latest summary</p>
          <h2 className="mt-2 line-clamp-2 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">{summary.filename}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">{summary.overview}</p>
          {summary.topics.length > 0 ? (
            <ul aria-label="Topics" className="mt-5 flex flex-wrap gap-2">
              {summary.topics.map((topic, index) => <li key={`${index}-${topic}`} className="rounded-md border border-[var(--theme-border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--muted-foreground)]">{topic}</li>)}
            </ul>
          ) : null}
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-[var(--theme-border)] bg-[var(--background)]/50 p-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-[var(--muted-foreground)]">Generated</dt><dd className="mt-1 font-semibold text-[var(--foreground)]">{formatDate(summary.summary_created_at)}</dd></div>
            <div><dt className="text-[var(--muted-foreground)]">Topics</dt><dd className="mt-1 font-semibold text-[var(--foreground)]">{summary.topic_count}</dd></div>
            <div><dt className="text-[var(--muted-foreground)]">Pages</dt><dd className="mt-1 font-semibold text-[var(--foreground)]">{summary.page_count ?? "—"}</dd></div>
          </dl>
          <ReaderLink documentId={summary.document_id} label="Open latest summary" className="mt-6" />
        </div>
      </div>
    </article>
  );
}

function ReaderLink({ documentId, label, className = "" }: { documentId: string; label: string; className?: string }) {
  return (
    <Link href={`/dashboard/study/${documentId}?tab=summary`} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${className}`}>
      {label}<span aria-hidden="true">→</span>
    </Link>
  );
}

function SummaryRow({ summary }: { summary: SummaryLibraryItem }) {
  return (
    <article className="group flex flex-col items-start gap-4 p-5 transition hover:bg-amber-500/[0.02] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Summary</span>
          <time dateTime={summary.summary_created_at} className="text-xs text-[var(--muted-foreground)]">{formatDate(summary.summary_created_at)}</time>
        </div>
        <h3 className="mt-2 truncate text-base font-bold text-[var(--foreground)]">{summary.filename}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">{summary.overview}</p>
        {summary.topics.length > 0 ? (
          <ul aria-label="Topics" className="mt-3 flex flex-wrap gap-1.5">
            {summary.topics.slice(0, 3).map((topic, index) => <li key={`${index}-${topic}`} className="max-w-[200px] truncate rounded-md border border-[var(--theme-border)] bg-[var(--background)] px-2 py-0.5 text-[11px] text-[var(--muted-foreground)]">{topic}</li>)}
            {summary.topics.length > 3 && (
              <li className="rounded-md border border-[var(--theme-border)] bg-[var(--background)] px-2 py-0.5 text-[11px] text-[var(--muted-foreground)]">+{summary.topics.length - 3}</li>
            )}
          </ul>
        ) : null}
      </div>
      <div className="w-full shrink-0 pt-2 sm:w-auto sm:pt-0">
        <ReaderLink documentId={summary.document_id} label="Read summary" className="w-full sm:w-auto" />
      </div>
    </article>
  );
}

function EmptyLibrary() {
  return (
    <section className="rounded-xl border border-dashed border-[var(--theme-border)] bg-[var(--card)] p-8 text-center sm:p-12">
      <h2 className="text-xl font-bold text-[var(--foreground)]">No generated summaries yet</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">Completed documents with a valid generated summary will appear here. Check your document library to see what is ready.</p>
      <Link href="/dashboard/docs" className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">View documents</Link>
    </section>
  );
}

function NoMatches() {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--card)] p-8 text-center">
      <h2 className="text-lg font-bold text-[var(--foreground)]">No summaries match these filters</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Try another title, topic, takeaway, or term—or return to your documents.</p>
      <Link href="/dashboard/docs" className="mt-4 inline-flex min-h-10 items-center font-semibold text-amber-700 underline decoration-amber-500/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-300">View documents</Link>
    </section>
  );
}
