import { Bot, Check, Clipboard, Layers3, User } from "lucide-react";

import { AIConversationSources } from "@/components/study/AIConversationSources";
import { SafeMessageContent } from "@/components/study/SafeMessageContent";
import { Button } from "@/components/ui/button";
import type { AIChatMessage } from "@/types/ai-chat";

export function AIConversationMessage({
  message,
  precedingQuestion,
  pending = false,
  copied,
  flashcardSaved,
  flashcardSaving,
  onCopy,
  onSaveFlashcard,
  onFollowup,
}: {
  message: AIChatMessage;
  precedingQuestion?: string;
  pending?: boolean;
  copied: boolean;
  flashcardSaved: boolean;
  flashcardSaving: boolean;
  onCopy: () => void;
  onSaveFlashcard: (question: string, answer: string) => void;
  onFollowup: (question: string) => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <article className="ai-chat-user-row" aria-label="Your message">
        <div className="ai-chat-user-bubble">
          <div className="ai-chat-message-label"><User size={14} aria-hidden="true" /> You</div>
          <p>{message.content}</p>
          {message.selected_text ? (
            <details className="ai-chat-used-context">
              <summary>Used selected context</summary>
              <p>{message.selected_text}</p>
            </details>
          ) : null}
          {pending ? <span className="ai-chat-pending-label">Sending…</span> : null}
        </div>
      </article>
    );
  }

  return (
    <article className="ai-chat-assistant-row" aria-label="StudFlow AI message">
      <div className="ai-chat-assistant-heading">
        <span className="ai-chat-avatar" aria-hidden="true"><Bot size={17} /></span>
        <span>StudFlow AI</span>
      </div>
      <SafeMessageContent content={message.content} citations={message.citations} />
      <AIConversationSources citations={message.citations} />
      {message.suggested_followups.length > 0 ? (
        <div className="ai-chat-followups" aria-label="Suggested follow-up questions">
          {message.suggested_followups.map((followup) => (
            <button key={followup} type="button" onClick={() => onFollowup(followup)}>
              {followup}
            </button>
          ))}
        </div>
      ) : null}
      <div className="ai-chat-message-actions">
        <Button type="button" variant="ghost" size="sm" onClick={onCopy}>
          {copied ? <Check size={14} /> : <Clipboard size={14} />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!precedingQuestion || flashcardSaving || flashcardSaved}
          onClick={() => precedingQuestion && onSaveFlashcard(precedingQuestion, message.content)}
        >
          {flashcardSaved ? <Check size={14} /> : <Layers3 size={14} />}
          {flashcardSaving ? "Saving…" : flashcardSaved ? "Saved" : "Save as flashcard"}
        </Button>
      </div>
      <time className="ai-chat-timestamp" dateTime={message.created_at}>
        {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at))}
      </time>
    </article>
  );
}
