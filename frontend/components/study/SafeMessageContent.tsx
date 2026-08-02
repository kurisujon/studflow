import type { ReactNode } from "react";

import type { AIChatCitation } from "@/types/ai-chat";

function renderInline(text: string, citations: AIChatCitation[]): ReactNode[] {
  const validCitations = new Set(citations.map((citation) => citation.index));
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[\d+\])/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    const citationMatch = /^\[(\d+)\]$/.exec(part);
    if (citationMatch && validCitations.has(Number(citationMatch[1]))) {
      return (
        <span key={index} className="ai-chat-citation-marker" aria-label={`Source ${citationMatch[1]}`}>
          {part}
        </span>
      );
    }
    return part;
  });
}

export function SafeMessageContent({
  content,
  citations,
}: {
  content: string;
  citations: AIChatCitation[];
}) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push(
        <pre key={`code-${index}`} className="ai-chat-code-block" aria-label={language ? `${language} code example` : "Code example"}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const children = renderInline(heading[2], citations);
      blocks.push(
        level === 1 ? <h3 key={`heading-${index}`}>{children}</h3> :
        level === 2 ? <h4 key={`heading-${index}`}>{children}</h4> :
        <h5 key={`heading-${index}`}>{children}</h5>,
      );
      index += 1;
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      const orderedList = Boolean(ordered);
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const match = orderedList
          ? /^\d+\.\s+(.+)$/.exec(lines[index])
          : /^[-*]\s+(.+)$/.exec(lines[index]);
        if (!match) break;
        items.push(<li key={`item-${index}`}>{renderInline(match[1], citations)}</li>);
        index += 1;
      }
      blocks.push(
        orderedList ? <ol key={`list-${index}`}>{items}</ol> : <ul key={`list-${index}`}>{items}</ul>,
      );
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith("```") &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^([-*]\s+|\d+\.\s+)/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={`paragraph-${index}`}>{renderInline(paragraph.join("\n"), citations)}</p>);
  }

  return <div className="ai-chat-message-content">{blocks}</div>;
}
