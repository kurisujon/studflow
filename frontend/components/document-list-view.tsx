"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileTextIcon,
  FolderPlusIcon,
} from "@/components/home/icon-registry";
import type { DocumentListItem } from "@/lib/types";

// Additional icons via inline SVG to avoid lucide version issues
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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
function FolderIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function DocumentListView({
  documents,
  title,
  targetTab,
}: {
  documents: DocumentListItem[];
  title: string;
  targetTab: "summary" | "flashcards" | "quiz";
}) {
  const [folders, setFolders] = useState<Record<string, string[]>>({
    Unorganized: documents.map((d) => d.id),
  });
  const [search, setSearch] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "folder" | "file"; id: string; label: string } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("studflow-folders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, string[]>;
        const allSavedDocIds = new Set(Object.values(parsed).flat());
        const unorganized: string[] = [];
        documents.forEach((doc) => {
          if (!allSavedDocIds.has(doc.id)) unorganized.push(doc.id);
        });
        parsed["Unorganized"] = [...(parsed["Unorganized"] || []), ...unorganized];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFolders(parsed);
      } catch {
        // ignored
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFolders({ Unorganized: documents.map((d) => d.id) });
    }

  }, [documents]);

  // Auto-focus input when modal opens (reset is handled in closeAddFolder)
  useEffect(() => {
    if (showAddFolder) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showAddFolder]);

  const closeAddFolder = () => {
    setShowAddFolder(false);
    setNewFolderName("");
  };

  // Close modal on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (showAddFolder && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeAddFolder();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAddFolder]);

  const saveFolders = (newFolders: Record<string, string[]>) => {
    setFolders(newFolders);
    localStorage.setItem("studflow-folders", JSON.stringify(newFolders));
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (name && !folders[name]) {
      saveFolders({ ...folders, [name]: [] });
      closeAddFolder();
    }
  };

  const handleMoveToFolder = (docId: string, targetFolder: string) => {
    const newFolders = { ...folders };
    Object.keys(newFolders).forEach((folderName) => {
      newFolders[folderName] = newFolders[folderName].filter((id) => id !== docId);
    });
    if (!newFolders[targetFolder]) newFolders[targetFolder] = [];
    newFolders[targetFolder].push(docId);
    saveFolders(newFolders);
  };

  const handleDeleteFolder = (folderName: string) => {
    const newFolders = { ...folders };
    const orphaned = newFolders[folderName] || [];
    delete newFolders[folderName];
    // Move files back to Unorganized
    newFolders["Unorganized"] = [...(newFolders["Unorganized"] || []), ...orphaned];
    saveFolders(newFolders);
    if (expandedFolder === folderName) setExpandedFolder(null);
    setConfirmDelete(null);
  };

  const handleDeleteFile = (docId: string) => {
    const newFolders = { ...folders };
    Object.keys(newFolders).forEach((folderName) => {
      newFolders[folderName] = newFolders[folderName].filter((id) => id !== docId);
    });
    saveFolders(newFolders);
    setConfirmDelete(null);
  };

  // Flatten all docs sorted by created_at descending for "Recent files" section
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Filtered search
  const filteredDocs = search.trim()
    ? documents.filter((d) => d.filename.toLowerCase().includes(search.trim().toLowerCase()))
    : null;

  const folderEntries = Object.entries(folders).filter(([name]) => name !== "Unorganized");
  const unorganizedIds = folders["Unorganized"] || [];
  const unorganizedDocs = unorganizedIds.map((id) => documents.find((d) => d.id === id)).filter(Boolean) as DocumentListItem[];

  return (
    <section style={{ minHeight: "calc(100dvh - var(--nav-height))", padding: "2rem 1.5rem 4rem", position: "relative" }}>
      {/* ── Overlay for confirm delete ── */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "var(--card)", border: "1px solid var(--theme-border)", borderRadius: "16px", padding: "2rem", maxWidth: "400px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              {confirmDelete.type === "folder" ? "Delete Folder?" : "Remove File?"}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--distill-text-secondary)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              {confirmDelete.type === "folder"
                ? `"${confirmDelete.label}" will be deleted. Files inside will be moved back to Unorganized.`
                : `"${confirmDelete.label}" will be removed from this view. The underlying document is not deleted.`}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", cursor: "pointer", fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete.type === "folder" ? handleDeleteFolder(confirmDelete.id) : handleDeleteFile(confirmDelete.id)}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "white", cursor: "pointer", fontWeight: 600 }}
              >
                {confirmDelete.type === "folder" ? "Delete Folder" : "Remove File"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Folder Modal ── */}
      {showAddFolder && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div ref={modalRef} style={{ backgroundColor: "var(--card)", border: "1px solid var(--theme-border)", borderRadius: "20px", padding: "2rem", width: "360px", boxShadow: "0 24px 72px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--theme-primary)" }}><FolderPlusIcon size={20} /></span> New Folder
              </h3>
              <button onClick={() => closeAddFolder()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--distill-text-secondary)", padding: "0.25rem" }}>
                <XIcon />
              </button>
            </div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--distill-text-secondary)", display: "block", marginBottom: "0.5rem" }}>
              Folder Name
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Biology 101"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1.5px solid var(--border)", backgroundColor: "var(--background)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button onClick={() => closeAddFolder()} style={{ flex: 1, padding: "0.65rem", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "transparent", cursor: "pointer", fontWeight: 500 }}>
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || !!folders[newFolderName.trim()]}
                style={{ flex: 1, padding: "0.65rem", borderRadius: "10px", border: "none", backgroundColor: newFolderName.trim() && !folders[newFolderName.trim()] ? "var(--theme-primary)" : "#ccc", color: "white", cursor: newFolderName.trim() ? "pointer" : "not-allowed", fontWeight: 600 }}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>{title}</h1>
          <button
            onClick={() => setShowAddFolder(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", backgroundColor: "var(--theme-primary)", color: "white", borderRadius: "10px", fontWeight: 600, border: "none", cursor: "pointer", fontSize: "0.9rem" }}
          >
            <FolderPlusIcon size={18} /> Add Folder
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div style={{ position: "relative", marginBottom: "2rem" }}>
          <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--distill-text-secondary)" }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.75rem", borderRadius: "12px", border: "1.5px solid var(--border)", backgroundColor: "var(--background)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* ── Search Results ── */}
        {filteredDocs !== null && (
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--distill-text-secondary)", marginBottom: "1rem" }}>
              {filteredDocs.length} result{filteredDocs.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
            </p>
            {filteredDocs.length === 0 ? (
              <p style={{ color: "var(--distill-text-secondary)" }}>No documents match your search.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {filteredDocs.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} targetTab={targetTab} folders={folders} onMove={handleMoveToFolder} onDelete={(doc) => setConfirmDelete({ type: "file", id: doc.id, label: doc.filename })} />
                ))}
              </div>
            )}
          </div>
        )}

        {filteredDocs === null && (
          <>
            {/* ── Folders Grid ── */}
            {folderEntries.length > 0 && (
              <div style={{ marginBottom: "2.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--distill-text-secondary)" }}>Folders</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                  {folderEntries.map(([folderName, docIds]) => {
                    const count = docIds.filter(id => documents.find(d => d.id === id)).length;
                    const isExpanded = expandedFolder === folderName;
                    return (
                      <div key={folderName}>
                        <div
                          style={{ backgroundColor: "var(--card)", border: `1.5px solid ${isExpanded ? "var(--theme-primary)" : "var(--theme-border)"}`, borderRadius: "14px", padding: "1.25rem", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: isExpanded ? "0 0 0 3px color-mix(in srgb, var(--theme-primary) 15%, transparent)" : "none" }}
                          onClick={() => setExpandedFolder(isExpanded ? null : folderName)}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ color: "var(--theme-primary)" }}><FolderIcon /></span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "folder", id: folderName, label: folderName }); }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.15rem", opacity: 0.7, borderRadius: "4px" }}
                              title="Delete folder"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                          <p style={{ fontWeight: 700, marginTop: "0.75rem", marginBottom: "0.25rem", fontSize: "0.95rem" }}>{folderName}</p>
                          <p style={{ fontSize: "0.8rem", color: "var(--distill-text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            {count} file{count !== 1 ? "s" : ""} <ChevronRight />
                          </p>
                        </div>
                        {/* Expanded folder docs */}
                        {isExpanded && (
                          <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "0.5rem", borderLeft: "2px solid var(--theme-primary)" }}>
                            {count === 0 ? (
                              <p style={{ fontSize: "0.85rem", color: "var(--distill-text-secondary)", padding: "0.5rem" }}>Empty folder</p>
                            ) : (
                              docIds.map((id) => {
                                const doc = documents.find((d) => d.id === id);
                                if (!doc) return null;
                                return <DocumentRow key={doc.id} doc={doc} targetTab={targetTab} folders={folders} onMove={handleMoveToFolder} onDelete={(doc) => setConfirmDelete({ type: "file", id: doc.id, label: doc.filename })} compact />;
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Recent Files ── */}
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--distill-text-secondary)", marginBottom: "1rem" }}>Recent Files</p>
              {recentDocs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--distill-text-secondary)" }}>
                  <p>No documents yet. <Link href="/upload" style={{ color: "var(--theme-primary)", fontWeight: 600 }}>Upload your first file →</Link></p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {recentDocs.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} targetTab={targetTab} folders={folders} onMove={handleMoveToFolder} onDelete={(doc) => setConfirmDelete({ type: "file", id: doc.id, label: doc.filename })} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Unorganized Files (if any, shown separately) ── */}
            {unorganizedDocs.length > 0 && folderEntries.length > 0 && (
              <div style={{ marginTop: "2rem" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--distill-text-secondary)", marginBottom: "1rem" }}>Unorganized</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {unorganizedDocs.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} targetTab={targetTab} folders={folders} onMove={handleMoveToFolder} onDelete={(doc) => setConfirmDelete({ type: "file", id: doc.id, label: doc.filename })} />
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

// ── Reusable document row ──
function DocumentRow({
  doc,
  targetTab,
  folders,
  onMove,
  onDelete,
  compact,
}: {
  doc: DocumentListItem;
  targetTab: string;
  folders: Record<string, string[]>;
  onMove: (id: string, folder: string) => void;
  onDelete: (doc: DocumentListItem) => void;
  compact?: boolean;
}) {
  const statusColor = doc.status === "COMPLETED" ? "#22c55e" : doc.status === "PROCESSING" ? "#f59e0b" : "#94a3b8";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: compact ? "0.65rem 0.75rem" : "0.875rem 1rem", backgroundColor: "var(--card)", borderRadius: "12px", border: "1px solid var(--theme-border)", gap: "0.75rem" }}>
      <Link href={`/dashboard/study/${doc.id}?tab=${targetTab}`} style={{ display: "flex", alignItems: "center", gap: "0.875rem", flex: 1, textDecoration: "none", color: "inherit", minWidth: 0 }}>
        <div style={{ padding: "0.5rem", backgroundColor: "color-mix(in srgb, var(--theme-soft) 50%, transparent)", borderRadius: "8px", flexShrink: 0 }}>
          <FileTextIcon size={18} color="var(--theme-primary)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: compact ? "0.875rem" : "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.2rem" }}>
            {doc.filename}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--distill-text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: statusColor, flexShrink: 0 }} />
            {doc.status} • {new Date(doc.created_at).toLocaleDateString()}
          </p>
        </div>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
        <select
          value={Object.entries(folders).find(([, ids]) => ids.includes(doc.id))?.[0] ?? "Unorganized"}
          onChange={(e) => onMove(doc.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{ padding: "0.35rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.8rem", backgroundColor: "var(--background)", cursor: "pointer", maxWidth: "130px" }}
        >
          <option value="Unorganized">Unorganized</option>
          {Object.keys(folders).filter(n => n !== "Unorganized").map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.35rem", opacity: 0.7, borderRadius: "6px", display: "flex", alignItems: "center" }}
          title="Remove file"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
