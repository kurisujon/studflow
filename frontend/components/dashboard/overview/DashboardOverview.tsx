import Link from "next/link";
import { ArrowRightIcon, BrainIcon, CalendarCheckIcon, CircleHelpIcon, FileTextIcon, FlameIcon, SparklesIcon, UploadIcon } from "@/components/home/icon-registry";
import { PageContainer, PageHeader, SectionHeading } from "@/components/dashboard/shared/PageHeader";
import type { DocumentListItem, UserQueue, UserStats } from "@/lib/types";
import { formatDate, getStreakDays, stripExtension } from "./utils";

export function DashboardOverview({ documents, stats, queue }: { documents: DocumentListItem[]; stats: UserStats; queue: UserQueue }) {
  const completed = documents.filter((item) => item.status === "COMPLETED");
  const continueDocument = completed[0];
  const recentDocuments = documents.slice(0, 5);
  const dueCount = queue.tasks.filter((task) => task.badge === "Review").length;
  const metrics = [
    { label: "Materials", value: stats.total_documents, icon: FileTextIcon },
    { label: "Flashcards", value: stats.total_flashcards, icon: BrainIcon },
    { label: "Average quiz", value: `${Math.round(stats.avg_quiz_score)}%`, icon: CircleHelpIcon },
    { label: "Quiz streak", value: `${stats.streak_days}d`, icon: FlameIcon },
  ];
  return <PageContainer>
    <PageHeader eyebrow="Your learning workspace" title="Overview" description="Move from source material to understanding, practice, and review." action={{ href: "/upload", label: "Upload material" }} />
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Quick actions">
      <QuickAction href="/upload" icon={UploadIcon} label="Upload material" detail="Add a PDF or DOCX" />
      <QuickAction href={continueDocument ? `/dashboard/study/${continueDocument.id}` : "/dashboard/docs"} icon={SparklesIcon} label="Continue studying" detail={continueDocument ? stripExtension(continueDocument.filename) : "Choose a ready material"} />
      <QuickAction href="/dashboard/review" icon={CalendarCheckIcon} label="Start review" detail={dueCount ? `${dueCount} review task${dueCount === 1 ? "" : "s"} available` : "Open today's queue"} />
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Study statistics">{metrics.map(({ label, value, icon: Icon }) => <article key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"><span className="grid size-10 place-items-center rounded-xl bg-[var(--theme-soft)] text-[var(--theme-primary)]"><Icon className="size-5" /></span><div><p className="text-xl font-bold tracking-tight text-foreground">{value}</p><p className="text-xs font-medium text-muted-foreground">{label}</p></div></article>)}</section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]">
      <section className="space-y-4"><SectionHeading title="Continue studying" description="Return to your newest ready material." />{continueDocument ? <article className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--theme-soft)] text-[var(--theme-primary)]"><FileTextIcon className="size-6" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-lg font-bold text-foreground" title={continueDocument.filename}>{stripExtension(continueDocument.filename)}</h3><p className="mt-1 text-sm text-muted-foreground">{continueDocument.page_count ? `${continueDocument.page_count} pages · ` : ""}{continueDocument.flashcard_count} flashcards{continueDocument.quiz_ready ? " · Quiz ready" : ""}</p></div><Link href={`/dashboard/study/${continueDocument.id}`} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)]">Open workspace<ArrowRightIcon className="size-4" /></Link></div></article> : <article className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><p className="font-semibold text-foreground">No ready materials yet</p><p className="mt-1 text-sm text-muted-foreground">Upload a source or check processing in your library.</p></article>}
      </section>
      <section className="space-y-4"><SectionHeading title="Today’s review" action={<Link href="/dashboard/review" className="text-sm font-semibold text-[var(--theme-primary)]">Open queue</Link>} />
        <div className="rounded-2xl border border-border bg-card p-4">{queue.tasks.length ? <div className="space-y-2">{queue.tasks.slice(0,4).map((task,index) => <div key={`${task.title}-${index}`} className="flex items-center gap-3 rounded-xl bg-muted/70 p-3"><span className="grid size-8 place-items-center rounded-lg bg-card text-[var(--theme-primary)]"><CalendarCheckIcon className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{task.title}</p><p className="truncate text-xs text-muted-foreground">{task.subtitle}</p></div><span className="text-[10px] font-bold uppercase text-muted-foreground">{task.badge}</span></div>)}</div> : <div className="py-8 text-center"><p className="font-semibold text-foreground">Queue clear</p><p className="mt-1 text-sm text-muted-foreground">There are no review tasks right now.</p></div>}</div>
      </section>
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]">
      <section className="space-y-4"><SectionHeading title="Recent learning materials" action={<Link href="/dashboard/docs" className="text-sm font-semibold text-[var(--theme-primary)]">View library</Link>} />
        <div className="overflow-hidden rounded-2xl border border-border bg-card">{recentDocuments.length ? recentDocuments.map((item) => <Link key={item.id} href={item.status === "COMPLETED" ? `/dashboard/study/${item.id}` : "/dashboard/docs"} className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 hover:bg-muted/50"><FileTextIcon className="size-4 shrink-0 text-[var(--theme-primary)]" /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{item.filename}</span><span className="hidden text-xs text-muted-foreground sm:inline">{formatDate(item.updated_at)}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : item.status === "FAILED" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{item.status === "COMPLETED" ? "Ready" : item.status === "FAILED" ? "Failed" : "Processing"}</span></Link>) : <p className="p-8 text-center text-sm text-muted-foreground">Your uploaded materials will appear here.</p>}</div>
      </section>
      <section className="space-y-4"><SectionHeading title="Quiz activity streak" description="Based on recorded quiz activity." /><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-foreground">{stats.streak_days}</span><span className="text-sm text-muted-foreground">days</span></div><div className="mt-5 grid grid-cols-7 gap-2">{getStreakDays(stats.streak_activity).map((day) => <div key={day.key} className="text-center"><span role="img" aria-label={`${day.fullLabel}: ${day.active ? "activity recorded" : "no activity recorded"}`} className={`mx-auto block size-8 rounded-lg ${day.active ? "bg-[var(--theme-primary)]" : "bg-muted"}`} /><span className="mt-1.5 block text-[10px] font-semibold text-muted-foreground">{day.label}</span></div>)}</div></div></section>
    </div>
  </PageContainer>;
}

function QuickAction({ href, icon: Icon, label, detail }: { href: string; icon: typeof UploadIcon; label: string; detail: string }) {
  return <Link href={href} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-[var(--theme-border)] hover:shadow-sm"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--theme-soft)] text-[var(--theme-primary)]"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-foreground">{label}</strong><span className="block truncate text-xs text-muted-foreground">{detail}</span></span><ArrowRightIcon className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-[var(--theme-primary)]" /></Link>;
}
