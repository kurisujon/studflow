"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FileTextIcon, FolderPlusIcon } from "@/components/home/icon-registry";
import type { DocumentListItem } from "@/lib/types";

/* ─── Inline SVG Icons ─── */
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function FolderSolidIcon({ color = "#f59e0b" }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function PdfIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  );
}

/* ─── Types ─── */
type Folders = Record<string, string[]>;
type ConfirmPayload = { type: "folder" | "file"; id: string; label: string } | null;

/* ─── Main Component ─── */
export function DocumentListView({
  documents,
  title,
  targetTab,
}: {
  documents: DocumentListItem[];
  title: string;
  targetTab: "summary" | "flashcards" | "quiz";
}) {
  const [folders, setFolders] = useState<Folders>({ Unorganized: documents.map((d) => d.id) });
  const [search, setSearch] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmPayload>(null);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Persist folders in localStorage ── */
  useEffect(() => {
    const saved = localStorage.getItem("studflow-folders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Folders;
        const allSaved = new Set(Object.values(parsed).flat());
        const orphaned: string[] = [];
        documents.forEach((d) => { if (!allSaved.has(d.id)) orphaned.push(d.id); });
        parsed["Unorganized"] = [...(parsed["Unorganized"] || []), ...orphaned];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFolders(parsed);
      } catch { /* ignored */ }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFolders({ Unorganized: documents.map((d) => d.id) });
    }
  }, [documents]);

  /* ── Auto-focus modal input ── */
  useEffect(() => {
    if (showAddFolder) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showAddFolder]);

  /* ── Close modal on outside click ── */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (showAddFolder && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeAddFolder();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddFolder]);

  const closeAddFolder = () => { setShowAddFolder(false); setNewFolderName(""); };

  const saveFolders = (next: Folders) => { setFolders(next); localStorage.setItem("studflow-folders", JSON.stringify(next)); };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (name && !folders[name]) { saveFolders({ ...folders, [name]: [] }); closeAddFolder(); }
  };

  const handleMoveToFolder = (docId: string, target: string) => {
    const next = { ...folders };
    Object.keys(next).forEach((f) => { next[f] = next[f].filter((id) => id !== docId); });
    if (!next[target]) next[target] = [];
    next[target].push(docId);
    saveFolders(next);
  };

  const handleDeleteFolder = (name: string) => {
    const next = { ...folders };
    const orphaned = next[name] || [];
    delete next[name];
    next["Unorganized"] = [...(next["Unorganized"] || []), ...orphaned];
    saveFolders(next);
    if (openFolder === name) setOpenFolder(null);
    setConfirmDelete(null);
  };

  const handleDeleteFile = (docId: string) => {
    const next = { ...folders };
    Object.keys(next).forEach((f) => { next[f] = next[f].filter((id) => id !== docId); });
    saveFolders(next);
    setConfirmDelete(null);
  };

  /* ── Derived data ── */
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const filteredDocs = search.trim()
    ? documents.filter((d) => d.filename.toLowerCase().includes(search.trim().toLowerCase()))
    : null;

  const namedFolders = Object.entries(folders).filter(([n]) => n !== "Unorganized");
  const unorganizedDocs = (folders["Unorganized"] || [])
    .map((id) => documents.find((d) => d.id === id))
    .filter(Boolean) as DocumentListItem[];

  const openFolderDocs = openFolder
    ? ((folders[openFolder] || []).map((id) => documents.find((d) => d.id === id)).filter(Boolean) as DocumentListItem[])
    : [];

  return (
    <section style={{ minHeight: "calc(100dvh - var(--nav-height))", padding: "2rem 1.5rem 4rem" }}>

      {/* ── Confirm Delete Overlay ── */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "var(--card)", border: "1px solid var(--theme-border)", borderRadius: "20px", padding: "2rem", maxWidth: "400px", width: "90%", boxShadow: "0 24px 80px rgba(0,0,0,0.35)", animation: "fadeSlideUp 0.2s ease" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              {confirmDelete.type === "folder" ? "Delete Folder?" : "Remove File?"}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--distill-text-secondary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              {confirmDelete.type === "folder"
                ? `"${confirmDelete.label}" will be deleted. Its files move back to Unorganized.`
                : `"${confirmDelete.label}" will be removed from this library view. The document itself is not deleted.`}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
              <button onClick={() => confirmDelete.type === "folder" ? handleDeleteFolder(confirmDelete.id) : handleDeleteFile(confirmDelete.id)} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "white", cursor: "pointer", fontWeight: 600 }}>
                {confirmDelete.type === "folder" ? "Delete Folder" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Folder Modal ── */}
      {showAddFolder && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div ref={modalRef} style={{ backgroundColor: "var(--card)", border: "1px solid var(--theme-border)", borderRadius: "20px", padding: "2rem", width: "360px", boxShadow: "0 24px 72px rgba(0,0,0,0.28)", animation: "fadeSlideUp 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <FolderSolidIcon color="var(--theme-primary)" /> New Folder
              </h3>
              <button onClick={closeAddFolder} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--distill-text-secondary)", padding: "0.25rem", borderRadius: "6px" }}>
                <XIcon />
              </button>
            </div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--distill-text-secondary)", display: "block", marginBottom: "0.5rem" }}>Folder Name</label>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Biology 101"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1.5px solid var(--border)", backgroundColor: "var(--background)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
            />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button onClick={closeAddFolder} style={{ flex: 1, padding: "0.65rem", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "transparent", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || !!folders[newFolderName.trim()]}
                style={{ flex: 1, padding: "0.65rem", borderRadius: "10px", border: "none", backgroundColor: newFolderName.trim() && !folders[newFolderName.trim()] ? "var(--theme-primary)" : "#d1d5db", color: "white", cursor: newFolderName.trim() ? "pointer" : "not-allowed", fontWeight: 600, transition: "background-color 0.2s" }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Animation Keyframes ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes folderPanelIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .folder-tile {
          transition: background-color 0.15s, box-shadow 0.15s, transform 0.12s;
          cursor: pointer;
          user-select: none;
        }
        .folder-tile:hover {
          background-color: color-mix(in srgb, var(--theme-soft) 60%, transparent) !important;
          box-shadow: 0 4px 16px color-mix(in srgb, var(--theme-shadow) 20%, transparent);
          transform: translateY(-1px);
        }
        .folder-tile:active {
          transform: scale(0.98) translateY(0);
        }
        .file-card {
          transition: background-color 0.15s, box-shadow 0.15s, transform 0.12s;
        }
        .file-card:hover {
          background-color: color-mix(in srgb, var(--theme-soft) 35%, var(--card)) !important;
          box-shadow: 0 2px 12px color-mix(in srgb, var(--theme-shadow) 15%, transparent);
          transform: translateY(-1px);
        }
        .file-card:active {
          transform: scale(0.99);
        }
        .icon-btn {
          transition: opacity 0.15s, color 0.15s, background-color 0.15s;
          opacity: 0;
        }
        .folder-tile:hover .icon-btn,
        .file-card:hover .icon-btn {
          opacity: 1;
        }
        .move-select {
          transition: border-color 0.15s;
        }
        .move-select:focus {
          outline: none;
          border-color: var(--theme-primary) !important;
        }
        .recent-file-card {
          transition: background-color 0.15s, box-shadow 0.15s, transform 0.15s;
        }
        .recent-file-card:hover {
          background-color: color-mix(in srgb, var(--theme-soft) 50%, var(--card)) !important;
          box-shadow: 0 6px 20px color-mix(in srgb, var(--theme-shadow) 20%, transparent);
          transform: translateY(-2px);
        }
        .recent-file-card:active {
          transform: scale(0.97);
        }
        .add-folder-btn {
          transition: background-color 0.15s, box-shadow 0.15s, transform 0.12s;
        }
        .add-folder-btn:hover {
          box-shadow: 0 4px 16px color-mix(in srgb, var(--theme-primary) 35%, transparent);
          transform: translateY(-1px);
        }
        .add-folder-btn:active {
          transform: scale(0.97);
        }
      `}</style>

      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>{title}</h1>
          <button
            className="add-folder-btn"
            onClick={() => setShowAddFolder(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", backgroundColor: "var(--theme-primary)", color: "white", borderRadius: "10px", fontWeight: 600, border: "none", cursor: "pointer", fontSize: "0.9rem" }}
          >
            <FolderPlusIcon size={18} /> Add Folder
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div style={{ position: "relative", marginBottom: "2.25rem" }}>
          <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--distill-text-secondary)", pointerEvents: "none" }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.8rem 1rem 0.8rem 2.75rem", borderRadius: "12px", border: "1.5px solid var(--border)", backgroundColor: "var(--background)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
          />
        </div>

        {/* ── Search Results ── */}
        {filteredDocs !== null ? (
          <div>
            <p style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--distill-text-secondary)", marginBottom: "1rem" }}>
              {filteredDocs.length} result{filteredDocs.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
            </p>
            {filteredDocs.length === 0
              ? <p style={{ color: "var(--distill-text-secondary)" }}>No documents match your search.</p>
              : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {filteredDocs.map((doc) => (
                    <FileRow key={doc.id} doc={doc} targetTab={targetTab} folders={folders} onMove={handleMoveToFolder} onDelete={(d) => setConfirmDelete({ type: "file", id: d.id, label: d.filename })} />
                  ))}
                </div>
            }
          </div>
        ) : (
          <>
            {/* ── Folders Section ── */}
            {namedFolders.length > 0 && (
              <div style={{ marginBottom: "2.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--distill-text-secondary)" }}>Folders</p>
                </div>

                {/* Folder tiles — horizontal grid like reference */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: openFolder ? "0" : "0" }}>
                  {namedFolders.map(([folderName, docIds], index) => {
                    const count = docIds.filter((id) => documents.find((d) => d.id === id)).length;
                    const isOpen = openFolder === folderName;
                    return (
                      <div
                        key={folderName}
                        className="folder-tile"
                        onClick={() => setOpenFolder(isOpen ? null : folderName)}
                        onMouseEnter={() => setHoveredFolder(folderName)}
                        onMouseLeave={() => setHoveredFolder(null)}
                        style={{
                          backgroundColor: isOpen ? "color-mix(in srgb, var(--theme-soft) 70%, transparent)" : "var(--card)",
                          border: `1.5px solid ${isOpen ? "var(--theme-primary)" : "var(--theme-border)"}`,
                          borderRadius: "12px",
                          padding: "0.875rem 1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          position: "relative",
                          boxShadow: isOpen ? "0 0 0 3px color-mix(in srgb, var(--theme-primary) 12%, transparent)" : "none",
                          animationDelay: `${index * 0.04}s`,
                        }}
                      >
                        <FolderSolidIcon color={isOpen ? "var(--theme-primary)" : "#f59e0b"} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{folderName}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--distill-text-secondary)", marginTop: "0.1rem" }}>{count} file{count !== 1 ? "s" : ""}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <button
                            className="icon-btn"
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "folder", id: folderName, label: folderName }); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.25rem", borderRadius: "4px" }}
                            title="Delete folder"
                          >
                            <TrashIcon />
                          </button>
                          <span style={{ color: "var(--distill-text-secondary)", transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "flex" }}>
                            <ChevronRightIcon />
                          </span>
                        </div>
                        {/* Hover indicator */}
                        {hoveredFolder === folderName && !isOpen && (
                          <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", backgroundColor: "var(--theme-primary)", borderRadius: "0 0 10px 10px", opacity: 0.5 }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Open Folder Panel — appears below the folder grid ── */}
                {openFolder && (
                  <div style={{ marginTop: "1rem", backgroundColor: "var(--card)", border: "1.5px solid var(--theme-primary)", borderRadius: "16px", overflow: "hidden", animation: "folderPanelIn 0.22s ease", boxShadow: "0 8px 32px color-mix(in srgb, var(--theme-primary) 10%, transparent)" }}>
                    {/* Panel header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid var(--theme-border)", backgroundColor: "color-mix(in srgb, var(--theme-soft) 30%, transparent)" }}>
                      <button
                        onClick={() => setOpenFolder(null)}
                        style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "none", border: "none", cursor: "pointer", color: "var(--distill-text-secondary)", padding: "0.25rem 0.5rem", borderRadius: "6px", fontSize: "0.85rem", transition: "color 0.15s" }}
                      >
                        <ArrowLeftIcon /> Back
                      </button>
                      <span style={{ width: "1px", height: "16px", backgroundColor: "var(--border)" }} />
                      <FolderSolidIcon color="var(--theme-primary)" />
                      <span style={{ fontWeight: 700, fontSize: "1rem" }}>{openFolder}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--distill-text-secondary)", marginLeft: "0.25rem" }}>
                        {openFolderDocs.length} file{openFolderDocs.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Panel body — file list */}
                    <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {openFolderDocs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "var(--distill-text-secondary)" }}>
                          <p style={{ fontSize: "0.9rem" }}>This folder is empty. Move files here using the dropdown on each file.</p>
                        </div>
                      ) : (
                        openFolderDocs.map((doc) => (
                          <FileRow
                            key={doc.id}
                            doc={doc}
                            targetTab={targetTab}
                            folders={folders}
                            onMove={handleMoveToFolder}
                            onDelete={(d) => setConfirmDelete({ type: "file", id: d.id, label: d.filename })}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Recent Files — card grid like reference ── */}
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--distill-text-secondary)", marginBottom: "1rem" }}>Recent Files</p>
              {recentDocs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--distill-text-secondary)" }}>
                  <p>No documents yet. <Link href="/upload" style={{ color: "var(--theme-primary)", fontWeight: 600 }}>Upload your first file →</Link></p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
                  {recentDocs.map((doc) => {
                    const statusColor = doc.status === "COMPLETED" ? "#22c55e" : doc.status === "PROCESSING" ? "#f59e0b" : "#94a3b8";
                    return (
                      <Link
                        key={doc.id}
                        href={`/dashboard/study/${doc.id}?tab=${targetTab}`}
                        className="recent-file-card"
                        style={{ backgroundColor: "var(--card)", border: "1px solid var(--theme-border)", borderRadius: "14px", padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem", textDecoration: "none", color: "inherit" }}
                      >
                        <div style={{ padding: "0.75rem", backgroundColor: "color-mix(in srgb, var(--theme-soft) 50%, transparent)", borderRadius: "10px", width: "fit-content" }}>
                          <PdfIcon />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.3rem" }}>
                            {doc.filename.replace(/\.[^/.]+$/, "")}
                          </p>
                          <p style={{ fontSize: "0.72rem", color: "var(--distill-text-secondary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", backgroundColor: statusColor, flexShrink: 0 }} />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Unorganized Files (shown only when named folders also exist) ── */}
            {unorganizedDocs.length > 0 && namedFolders.length > 0 && (
              <div style={{ marginTop: "2.5rem" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--distill-text-secondary)", marginBottom: "1rem" }}>Unorganized</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {unorganizedDocs.map((doc) => (
                    <FileRow key={doc.id} doc={doc} targetTab={targetTab} folders={folders} onMove={handleMoveToFolder} onDelete={(d) => setConfirmDelete({ type: "file", id: d.id, label: d.filename })} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ─── File Row Sub-component ─── */
function FileRow({
  doc,
  targetTab,
  folders,
  onMove,
  onDelete,
}: {
  doc: DocumentListItem;
  targetTab: string;
  folders: Folders;
  onMove: (id: string, folder: string) => void;
  onDelete: (doc: DocumentListItem) => void;
}) {
  const statusColor = doc.status === "COMPLETED" ? "#22c55e" : doc.status === "PROCESSING" ? "#f59e0b" : "#94a3b8";
  const currentFolder = Object.entries(folders).find(([, ids]) => ids.includes(doc.id))?.[0] ?? "Unorganized";

  return (
    <div
      className="file-card"
      style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 1rem", backgroundColor: "var(--background)", borderRadius: "12px", border: "1px solid var(--theme-border)" }}
    >
      <Link href={`/dashboard/study/${doc.id}?tab=${targetTab}`} style={{ display: "flex", alignItems: "center", gap: "0.875rem", flex: 1, textDecoration: "none", color: "inherit", minWidth: 0 }}>
        <div style={{ padding: "0.5rem", backgroundColor: "color-mix(in srgb, var(--theme-soft) 50%, transparent)", borderRadius: "8px", flexShrink: 0 }}>
          <FileTextIcon size={18} color="var(--theme-primary)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.2rem" }}>{doc.filename}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--distill-text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", backgroundColor: statusColor, flexShrink: 0 }} />
            {doc.status} &bull; {new Date(doc.created_at).toLocaleDateString()}
          </p>
        </div>
      </Link>

      <select
        className="move-select"
        value={currentFolder}
        onChange={(e) => onMove(doc.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "0.35rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.78rem", backgroundColor: "var(--background)", cursor: "pointer", maxWidth: "130px", flexShrink: 0 }}
      >
        <option value="Unorganized">Unorganized</option>
        {Object.keys(folders).filter((n) => n !== "Unorganized").map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      <button
        className="icon-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.35rem", borderRadius: "6px", display: "flex", alignItems: "center", flexShrink: 0 }}
        title="Remove"
      >
        <TrashIcon />
      </button>
    </div>
  );
}
