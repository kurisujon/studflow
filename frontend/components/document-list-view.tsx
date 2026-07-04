"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpenIcon, FileTextIcon, FolderPlusIcon } from "lucide-react";

import type { DocumentListItem } from "@/lib/types";

export function DocumentListView({ 
  documents, 
  title, 
  targetTab 
}: { 
  documents: DocumentListItem[]; 
  title: string;
  targetTab: "summary" | "flashcards" | "quiz";
}) {
  const [folders, setFolders] = useState<Record<string, string[]>>({
    "Unorganized": documents.map(d => d.id)
  });
  const [newFolderName, setNewFolderName] = useState("");

  // Load folders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("studflow-folders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all documents exist somewhere
        const allSavedDocIds = new Set(Object.values(parsed).flat());
        const unorganized: string[] = [];
        documents.forEach(doc => {
          if (!allSavedDocIds.has(doc.id)) unorganized.push(doc.id);
        });
        
        parsed["Unorganized"] = [...(parsed["Unorganized"] || []), ...unorganized];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFolders(parsed);
      } catch {
        // Ignored
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFolders({ "Unorganized": documents.map(d => d.id) });
    }
  }, [documents]);

  const saveFolders = (newFolders: Record<string, string[]>) => {
    setFolders(newFolders);
    localStorage.setItem("studflow-folders", JSON.stringify(newFolders));
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() && !folders[newFolderName.trim()]) {
      saveFolders({ ...folders, [newFolderName.trim()]: [] });
      setNewFolderName("");
    }
  };

  const handleMoveToFolder = (docId: string, targetFolder: string) => {
    const newFolders = { ...folders };
    // Remove from all folders
    Object.keys(newFolders).forEach(folderName => {
      newFolders[folderName] = newFolders[folderName].filter(id => id !== docId);
    });
    // Add to target
    if (!newFolders[targetFolder]) newFolders[targetFolder] = [];
    newFolders[targetFolder].push(docId);
    saveFolders(newFolders);
  };

  return (
    <section style={{ minHeight: "calc(100dvh - var(--nav-height))", padding: "2rem 1.5rem 3rem" }}>
      <div className="container" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>{title}</h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              type="text" 
              placeholder="New folder name..." 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
            />
            <button 
              onClick={handleCreateFolder}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "var(--theme-primary)", color: "white", borderRadius: "8px", fontWeight: 600 }}
            >
              <FolderPlusIcon size={18} /> Add Folder
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.entries(folders).map(([folderName, docIds]) => {
            const folderDocs = docIds.map(id => documents.find(d => d.id === id)).filter(Boolean) as DocumentListItem[];
            if (folderDocs.length === 0 && folderName === "Unorganized") return null;

            return (
              <div key={folderName} style={{ backgroundColor: "var(--card)", border: "1px solid var(--theme-border)", borderRadius: "16px", padding: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <FolderOpenIcon size={20} color="var(--theme-primary)" /> {folderName}
                </h2>
                
                {folderDocs.length === 0 ? (
                  <p style={{ color: "var(--distill-text-secondary)", fontSize: "0.9rem" }}>No documents in this folder.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {folderDocs.map(doc => (
                      <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", backgroundColor: "var(--background)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                        <Link href={`/dashboard/study/${doc.id}?tab=${targetTab}`} style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, textDecoration: "none", color: "inherit" }}>
                          <div style={{ padding: "0.5rem", backgroundColor: "color-mix(in srgb, var(--theme-soft) 40%, transparent)", borderRadius: "8px" }}>
                            <FileTextIcon size={20} color="var(--theme-primary)" />
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{doc.filename}</p>
                            <p style={{ fontSize: "0.8rem", color: "var(--distill-text-secondary)" }}>{doc.status} • {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </Link>
                        
                        <select 
                          value={folderName} 
                          onChange={(e) => handleMoveToFolder(doc.id, e.target.value)}
                          style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.85rem", backgroundColor: "var(--background)", cursor: "pointer" }}
                        >
                          {Object.keys(folders).map(name => (
                            <option key={name} value={name}>Move to {name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
