import Link from "next/link";
import { FileTextIcon, UploadIcon } from "@/components/home/icon-registry";

export function EmptyState({ title, description, action = { href: "/upload", label: "Upload material" } }: { title: string; description: string; action?: { href: string; label: string } }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
    <span className="grid size-11 place-items-center rounded-xl bg-[var(--theme-soft)] text-[var(--theme-primary)]"><FileTextIcon className="size-5" /></span>
    <h2 className="mt-4 text-base font-bold text-foreground">{title}</h2>
    <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    <Link href={action.href} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-on-primary)]"><UploadIcon className="size-4" />{action.label}</Link>
  </div>;
}
