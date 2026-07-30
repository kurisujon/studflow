"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

import { DashboardFeatureShell } from "@/components/dashboard/DashboardFeatureShell";
import { RetryDocumentButton } from "@/components/retry-document-button";
import type { DocumentListItem } from "@/lib/types";

type LibraryFilter = "all" | "ready" | "processing" | "failed";
type Folders = Record<string, string[]>;
type FolderDialog = { mode: "create" } | { mode: "delete"; name: string } | null;

type DocumentListViewProps = {
  documents: DocumentListItem[];
};

function Icon({
  children,
  className = "size-4",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

const SearchIcon = () => (
  <Icon><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></Icon>
);
const FolderIcon = () => (
  <Icon className="size-5"><path d="M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Icon>
);
const PencilIcon = () => (
  <Icon><path d="m4 20 4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11z" /></Icon>
);
const TrashIcon = () => (
  <Icon><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></Icon>
);
const FileIcon = () => (
  <Icon className="size-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></Icon>
);
const CheckIcon = () => (
  <Icon><path d="m5 12 4 4L19 6" /></Icon>
);

function isProcessing(document: DocumentListItem) {
  return document.status !== "COMPLETED" && document.status !== "FAILED";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function DocumentListView({ documents }: DocumentListViewProps) {
  return <DocumentLibrary documents={documents} />;
}

function DocumentLibrary({ documents }: DocumentListViewProps) {
  const [folders, setFolders] = useState<Folders>({
    Unorganized: documents.map((document) => document.id),
  });
  const [search, setSearch] = useState("");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [dialog, setDialog] = useState<FolderDialog>(null);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const dialogRef = useRef<HTMLDivElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("studflow-folders");
    if (!saved) return;

    let nextFolders: Folders;
    try {
      const parsed = JSON.parse(saved) as Folders;
      const validIds = new Set(documents.map((document) => document.id));
      const next: Folders = {};
      const assigned = new Set<string>();

      Object.entries(parsed).forEach(([name, ids]) => {
        next[name] = ids.filter((id) => validIds.has(id) && !assigned.has(id));
        next[name].forEach((id) => assigned.add(id));
      });
      next.Unorganized = [
        ...(next.Unorganized ?? []),
        ...documents
          .map((document) => document.id)
          .filter((id) => !assigned.has(id)),
      ];
      nextFolders = next;
    } catch {
      nextFolders = { Unorganized: documents.map((document) => document.id) };
    }

    const hydrationTimer = window.setTimeout(() => setFolders(nextFolders), 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [documents]);

  useEffect(() => {
    if (!dialog) return;

    const previous = document.activeElement as HTMLElement | null;
    window.setTimeout(() => folderInputRef.current?.focus(), 0);

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDialog(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      (triggerRef.current ?? previous)?.focus();
    };
  }, [dialog]);

  function saveFolders(next: Folders) {
    setFolders(next);
    window.localStorage.setItem("studflow-folders", JSON.stringify(next));
  }

  function openDialog(next: FolderDialog, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setFolderName("");
    setDialog(next);
  }

  function createFolder() {
    const name = folderName.trim();
    if (!name || folders[name]) return;
    saveFolders({ ...folders, [name]: [] });
    setDialog(null);
  }

  function deleteFolder(name: string) {
    const next = { ...folders };
    const movedIds = next[name] ?? [];
    delete next[name];
    next.Unorganized = Array.from(
      new Set([...(next.Unorganized ?? []), ...movedIds]),
    );
    saveFolders(next);
    if (openFolder === name) setOpenFolder(null);
    setDialog(null);
  }

  function moveDocument(documentId: string, folderName: string) {
    const next = Object.fromEntries(
      Object.entries(folders).map(([name, ids]) => [
        name,
        ids.filter((id) => id !== documentId),
      ]),
    ) as Folders;
    next[folderName] = [...(next[folderName] ?? []), documentId];
    saveFolders(next);
  }

  function renameFolder(name: string) {
    const nextName = renameValue.trim();
    if (!nextName || nextName === name || folders[nextName]) {
      setEditingFolder(null);
      return;
    }
    const next = Object.fromEntries(
      Object.entries(folders).map(([key, ids]) => [
        key === name ? nextName : key,
        ids,
      ]),
    ) as Folders;
    saveFolders(next);
    if (openFolder === name) setOpenFolder(nextName);
    setEditingFolder(null);
  }

  const summaryReadyCount = documents.filter(
    (document) => document.summary_ready,
  ).length;
  const totalFlashcards = documents.reduce(
    (total, document) => total + document.flashcard_count,
    0,
  );
  const quizReadyCount = documents.filter(
    (document) => document.quiz_ready,
  ).length;

  const visibleDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...documents]
      .sort((left, right) =>
          new Date(right.updated_at).getTime() -
          new Date(left.updated_at).getTime()
      )
      .filter((document) => {
        if (
          normalizedSearch &&
          !document.filename.toLowerCase().includes(normalizedSearch)
        ) {
          return false;
        }
        if (filter === "ready") {
          return document.status === "COMPLETED";
        }
        if (filter === "processing") {
          return isProcessing(document);
        }
        if (filter === "failed") return document.status === "FAILED";
        return true;
      });
  }, [documents, filter, search]);

  const folderEntries = Object.entries(folders).filter(
    ([name]) => name !== "Unorganized",
  );
  const openFolderIds = openFolder ? folders[openFolder] ?? [] : [];
  const openFolderDocuments = visibleDocuments.filter((document) =>
    openFolderIds.includes(document.id),
  );

  const filterLabels: Array<{ value: LibraryFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "ready", label: "Ready" },
    { value: "processing", label: "Processing" },
    { value: "failed", label: "Needs attention" },
  ];

  return (
    <DashboardFeatureShell
      tone="documents"
      eyebrow="Study library"
      title="Your study library"
      description="Organize uploaded materials and see exactly which learning tools are ready."
      count={{
        value: documents.length,
        label: documents.length === 1 ? "document" : "documents",
      }}
      action={{ href: "/dashboard/upload", label: "Upload document" }}
    >
      {dialog ? (
        <FolderDialogView
          dialog={dialog}
          dialogRef={dialogRef}
          inputRef={folderInputRef}
          folderName={folderName}
          setFolderName={setFolderName}
          onClose={() => setDialog(null)}
          onCreate={createFolder}
          onDelete={deleteFolder}
        />
      ) : null}

      <LibraryStats
        total={documents.length}
        summaryReady={summaryReadyCount}
        flashcards={totalFlashcards}
        quizzes={quizReadyCount}
      />

      <section aria-labelledby="library-resources" className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-4 shadow-[0_14px_36px_var(--theme-shadow)] lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-xl">
            <label htmlFor="library-search" className="text-sm font-semibold text-[var(--foreground)]">
              Search documents
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                <SearchIcon />
              </span>
              <input
                id="library-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by filename"
                className="min-h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--background)] py-2 pl-10 pr-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Resource filters">
            {filterLabels.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={`min-h-10 rounded-full border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] ${
                  filter === item.value
                    ? "border-[var(--theme-primary)] bg-[var(--theme-soft)] text-[var(--theme-primary)]"
                    : "border-[var(--theme-border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:border-[var(--theme-primary)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--theme-primary)]">
              Browser folders
            </p>
            <h2 id="library-resources" className="mt-1 text-2xl font-bold text-[var(--foreground)]">
              Your materials
            </h2>
          </div>
          <button
            type="button"
            onClick={(event) => openDialog({ mode: "create" }, event.currentTarget)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
          >
            <FolderIcon /> New folder
          </button>
        </div>

        {folderEntries.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {folderEntries.map(([name, ids]) => (
              <li key={name} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-3">
                <div className="flex items-center gap-2">
                  {editingFolder === name ? (
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300"><FolderIcon /></span>
                      <span className="min-w-0 flex-1">
                        <input
                          aria-label={`Rename ${name}`}
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") renameFolder(name);
                            if (event.key === "Escape") setEditingFolder(null);
                          }}
                          onBlur={() => renameFolder(name)}
                          autoFocus
                          className="w-full rounded-md border border-[var(--theme-primary)] bg-[var(--background)] px-2 py-1 text-sm outline-none"
                        />
                        <span className="text-xs text-[var(--muted-foreground)]">{ids.length} {ids.length === 1 ? "file" : "files"}</span>
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenFolder(openFolder === name ? null : name)}
                      aria-expanded={openFolder === name}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[var(--theme-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300"><FolderIcon /></span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-[var(--foreground)]">{name}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">{ids.length} {ids.length === 1 ? "file" : "files"}</span>
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Rename ${name}`}
                    onClick={() => { setEditingFolder(name); setRenameValue(name); }}
                    className="grid size-9 place-items-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--theme-soft)] hover:text-[var(--theme-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                  ><PencilIcon /></button>
                  <button
                    type="button"
                    aria-label={`Delete ${name}`}
                    onClick={(event) => openDialog({ mode: "delete", name }, event.currentTarget)}
                    className="grid size-9 place-items-center rounded-lg text-red-600 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  ><TrashIcon /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {openFolder ? (
          <ResourceSection
            title={openFolder}
            description={`${openFolderDocuments.length} matching ${openFolderDocuments.length === 1 ? "resource" : "resources"}`}
            documents={openFolderDocuments}
            folders={folders}
            onMove={moveDocument}
            emptyMessage="This folder has no matching resources."
          />
        ) : (
          <ResourceSection
            title="All documents"
            description={`${visibleDocuments.length} ${visibleDocuments.length === 1 ? "resource" : "resources"}`}
            documents={visibleDocuments}
            folders={folders}
            onMove={moveDocument}
            emptyMessage={
              documents.length === 0
                ? "Upload your first document to begin building study materials."
                : "No resources match the current search and filter."
            }
          />
        )}
      </section>
    </DashboardFeatureShell>
  );
}

function LibraryStats({
  total,
  summaryReady,
  flashcards,
  quizzes,
}: {
  total: number;
  summaryReady: number;
  flashcards: number;
  quizzes: number;
}) {
  const items = [
    { label: "Documents", value: total, tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    { label: "Summaries ready", value: summaryReady, tone: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
    { label: "Flashcards", value: flashcards, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
    { label: "Quizzes ready", value: quizzes, tone: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" },
  ];

  return (
    <section aria-label="Documents overview">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <li
            key={item.label}
            className="rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-4 shadow-[0_14px_36px_var(--theme-shadow)]"
          >
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.tone}`}>
              {item.label}
            </span>
            <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">{item.value}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FolderDialogView({
  dialog,
  dialogRef,
  inputRef,
  folderName,
  setFolderName,
  onClose,
  onCreate,
  onDelete,
}: {
  dialog: Exclude<FolderDialog, null>;
  dialogRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  folderName: string;
  setFolderName: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
  onDelete: (name: string) => void;
}) {
  const titleId = "folder-dialog-title";
  const descriptionId = "folder-dialog-description";

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!controls?.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={trapFocus}
        className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-5 shadow-2xl"
      >
        <h2 id={titleId} className="text-xl font-bold text-[var(--foreground)]">
          {dialog.mode === "create" ? "Create a folder" : `Delete ${dialog.name}?`}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          {dialog.mode === "create"
            ? "Folders are saved in this browser and help organize your study library."
            : "Documents inside this folder will move back to Unorganized. No uploaded document will be deleted."}
        </p>

        {dialog.mode === "create" ? (
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              onCreate();
            }}
          >
            <label htmlFor="folder-name" className="text-sm font-semibold text-[var(--foreground)]">
              Folder name
            </label>
            <input
              ref={inputRef}
              id="folder-name"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--background)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]"
            />
            <div className="mt-5 flex justify-end gap-3">
              <DialogButton onClick={onClose}>Cancel</DialogButton>
              <DialogButton primary disabled={!folderName.trim()} type="submit">Create folder</DialogButton>
            </div>
          </form>
        ) : (
          <div className="mt-5 flex justify-end gap-3">
            <DialogButton onClick={onClose}>Cancel</DialogButton>
            <button
              type="button"
              autoFocus
              onClick={() => onDelete(dialog.name)}
              className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Delete folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DialogButton({
  children,
  primary = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      className={`min-h-11 rounded-xl px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "bg-[var(--theme-primary)] text-white"
          : "border border-[var(--theme-border)] bg-[var(--background)] text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function ResourceSection({
  title,
  description,
  documents,
  folders,
  onMove,
  emptyMessage,
}: {
  title: string;
  description: string;
  documents: DocumentListItem[];
  folders: Folders;
  onMove: (documentId: string, folderName: string) => void;
  emptyMessage: string;
}) {
  return (
    <section aria-labelledby={`resource-${title.replace(/\s+/g, "-").toLowerCase()}`} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--card)] p-4 shadow-[0_18px_50px_var(--theme-shadow)] sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h3 id={`resource-${title.replace(/\s+/g, "-").toLowerCase()}`} className="text-lg font-bold text-[var(--foreground)]">{title}</h3>
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      </div>
      {documents.length > 0 ? (
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((document) => (
            <li key={document.id}>
              <ResourceCard
                document={document}
                folders={folders}
                onMove={onMove}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--theme-border)] bg-[var(--background)] p-8 text-center text-sm leading-6 text-[var(--muted-foreground)]">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function ResourceCard({
  document,
  folders,
  onMove,
}: {
  document: DocumentListItem;
  folders: Folders;
  onMove: (documentId: string, folderName: string) => void;
}) {
  const failed = document.status === "FAILED";
  const processing = isProcessing(document);
  const canOpen = document.status === "COMPLETED";
  const currentFolder =
    Object.entries(folders).find(([, ids]) => ids.includes(document.id))?.[0] ??
    "Unorganized";
  const statusLabel = failed
    ? "Needs attention"
    : processing
      ? document.status
      : "Ready";

  return (
    <article className="flex h-full min-h-[300px] flex-col rounded-2xl border border-[var(--theme-border)] bg-[var(--background)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--theme-primary)] focus-within:border-[var(--theme-primary)]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
          <FileIcon />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${failed ? "bg-red-500/10 text-red-700 dark:text-red-300" : processing ? "bg-amber-500/10 text-amber-800 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"}`}>
          {statusLabel}
        </span>
      </div>
      <h4 className="mt-4 line-clamp-2 font-bold text-[var(--foreground)]">{document.filename}</h4>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {formatDate(document.updated_at)}{document.page_count ? ` · ${document.page_count} pages` : ""}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ReadinessBadge ready={document.summary_ready} label="Summary" />
        <ReadinessBadge ready={document.flashcard_count > 0} label={`${document.flashcard_count} cards`} />
        <ReadinessBadge ready={document.quiz_ready} label="Quiz" />
      </div>

      {processing ? (
        <p aria-live="polite" className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
          StudFlow is processing this document. Refresh later to check its study materials.
        </p>
      ) : failed ? (
        <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
          Processing did not finish. Retry to rebuild the generated materials.
        </p>
      ) : null}

      <div className="mt-auto space-y-3 pt-5">
        <label className="block text-xs font-semibold text-[var(--muted-foreground)]">
          Folder
          <select
            value={currentFolder}
            onChange={(event) => onMove(document.id, event.target.value)}
            className="mt-1 min-h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--card)] px-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-shadow)]"
          >
            <option value="Unorganized">Unorganized</option>
            {Object.keys(folders).filter((name) => name !== "Unorganized").map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        {canOpen ? (
          <Link
            href={`/dashboard/study/${document.id}?tab=summary`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
          >
            Open study workspace <span aria-hidden="true">→</span>
          </Link>
        ) : failed ? (
          <RetryDocumentButton documentId={document.id} />
        ) : null}
      </div>
    </article>
  );
}

function ReadinessBadge({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--card)] px-2 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
      {ready ? <span className="text-emerald-600"><CheckIcon /></span> : <span aria-hidden="true">·</span>}
      {label}<span className="sr-only"> {ready ? "ready" : "not ready"}</span>
    </span>
  );
}
