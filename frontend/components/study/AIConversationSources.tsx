import { ExternalLink, FileText, Globe } from "lucide-react";

import { extractCitationDomain, sanitizeExternalHttpsUrl } from "@/lib/api/ai-chat";
import type { AIChatCitation } from "@/types/ai-chat";

export function AIConversationSources({
  citations,
  searchAttributionHtml,
}: {
  citations: AIChatCitation[];
  searchAttributionHtml?: string | null;
}) {
  if (citations.length === 0) return null;

  const documentCitations = citations.filter((item) => item.source_type === "document");
  const webCitations = citations.filter((item) => item.source_type === "web");

  return (
    <div className="ai-chat-sources-group">
      {documentCitations.length > 0 ? (
        <section className="ai-chat-sources" aria-label="Sources from your document">
          <p className="study-meta-label">From your document</p>
          <div className="ai-chat-source-list">
            {documentCitations.map((citation) => (
              <div
                key={`doc-${citation.index}-${citation.chunk_id ?? citation.title}`}
                className="ai-chat-source-card"
              >
                <span className="ai-chat-source-icon" aria-hidden="true">
                  <FileText size={15} />
                </span>
                <span className="ai-chat-source-copy">
                  <span className="ai-chat-source-title">
                    [{citation.index}] {citation.title}
                  </span>
                  {citation.page_number ? <span>Page {citation.page_number}</span> : null}
                  {citation.excerpt ? (
                    <span className="ai-chat-source-excerpt">{citation.excerpt}</span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {webCitations.length > 0 ? (
        <section className="ai-chat-sources" aria-label="Sources from the web">
          <div className="ai-chat-sources-header">
            <p className="study-meta-label">From the web</p>
            <span className="ai-chat-web-attribution-badge">Grounded with Google Search</span>
          </div>
          <div className="ai-chat-source-list">
            {webCitations.map((citation) => {
              const safeUrl = sanitizeExternalHttpsUrl(citation.url);
              const domain = extractCitationDomain(safeUrl);
              const body = (
                <>
                  <span className="ai-chat-source-icon" aria-hidden="true">
                    <Globe size={15} />
                  </span>
                  <span className="ai-chat-source-copy">
                    <span className="ai-chat-source-title">
                      [{citation.index}] {citation.title}
                    </span>
                    {domain ? <span className="ai-chat-source-domain">{domain}</span> : null}
                    {citation.excerpt ? (
                      <span className="ai-chat-source-excerpt">{citation.excerpt}</span>
                    ) : null}
                  </span>
                  {safeUrl ? <ExternalLink size={14} aria-hidden="true" /> : null}
                </>
              );

              return safeUrl ? (
                <a
                  key={`web-${citation.index}-${safeUrl}`}
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  referrerPolicy="no-referrer"
                  className="ai-chat-source-card"
                >
                  {body}
                  <span className="sr-only">Open verified web source in a new tab</span>
                </a>
              ) : (
                <div
                  key={`web-${citation.index}-${citation.title}`}
                  className="ai-chat-source-card"
                >
                  {body}
                </div>
              );
            })}
          </div>
          {searchAttributionHtml ? (
            <iframe
              title="Google Search suggestions"
              sandbox=""
              referrerPolicy="no-referrer"
              srcDoc={searchAttributionHtml}
              className="ai-chat-search-widget"
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
