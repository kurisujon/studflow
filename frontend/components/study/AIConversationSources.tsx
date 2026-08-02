import { FileText, ExternalLink } from "lucide-react";

import type { AIChatCitation } from "@/types/ai-chat";

export function AIConversationSources({ citations }: { citations: AIChatCitation[] }) {
  if (citations.length === 0) return null;

  return (
    <section className="ai-chat-sources" aria-label="Sources from your document">
      <p className="study-meta-label">From your document</p>
      <div className="ai-chat-source-list">
        {citations.map((citation) => {
          const body = (
            <>
              <span className="ai-chat-source-icon" aria-hidden="true"><FileText size={15} /></span>
              <span className="ai-chat-source-copy">
                <span className="ai-chat-source-title">[{citation.index}] {citation.title}</span>
                {citation.page_number ? <span>Page {citation.page_number}</span> : null}
                {citation.excerpt ? <span className="ai-chat-source-excerpt">{citation.excerpt}</span> : null}
              </span>
              {citation.url ? <ExternalLink size={14} aria-hidden="true" /> : null}
            </>
          );

          return citation.url ? (
            <a key={`${citation.index}-${citation.chunk_id ?? citation.url}`} href={citation.url} target="_blank" rel="noopener noreferrer" className="ai-chat-source-card">
              {body}<span className="sr-only">Open source in a new tab</span>
            </a>
          ) : (
            <div key={`${citation.index}-${citation.chunk_id ?? citation.title}`} className="ai-chat-source-card">
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
