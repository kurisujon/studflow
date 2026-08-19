"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { ChevronDown, ChevronUp, MessageSquarePlus, RefreshCw, Send, Square } from "lucide-react";

import { AIConversationMessage } from "@/components/study/AIConversationMessage";
import { Button } from "@/components/ui/button";
import {
  AIChatAPIError,
  createAIConversation,
  getAIConversationMessages,
  listAIConversations,
  sendAIConversationMessage,
} from "@/lib/api/ai-chat";
import { createFlashcard } from "@/lib/api/flashcards";
import type { AIToolMode, StudyAIContext } from "@/types/annotations";
import type { AIChatMessage, AIConversation } from "@/types/ai-chat";

const QUICK_ACTIONS = [
  { label: "Simplify", question: "Explain this in simpler terms." },
  { label: "Define", question: "Define the main term clearly and explain how it is used." },
  { label: "Give an example", question: "Give me a clear practical example of this concept." },
] as const;

const CONVERSATION_CHANGED_MESSAGE = "The conversation changed while the answer was generated. Please retry.";
const INDEX_PREPARING_MESSAGE = "The document search index is being prepared. Please retry shortly.";

function contextText(context: StudyAIContext): string | undefined {
  const selected = context.selectedText.trim();
  const note = context.noteContent?.trim();
  if (context.source === "general" || (!selected && !note)) return undefined;
  if (context.source === "note") {
    return [selected ? `Selected passage:\n${selected}` : "", note ? `Student note:\n${note}` : ""]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 8000);
  }
  return selected.slice(0, 8000) || undefined;
}

function contextLabel(context: StudyAIContext) {
  if (context.source === "note") return "Note context";
  if (context.source === "highlight") return "Highlighted passage";
  if (context.source === "underline") return "Underlined passage";
  return "Selected passage";
}

function mergeMessages(current: AIChatMessage[], incoming: AIChatMessage[]) {
  const byId = new Map<string, AIChatMessage>();
  for (const message of [...current, ...incoming]) byId.set(message.id, message);
  return [...byId.values()].sort((left, right) => left.sequence_number - right.sequence_number);
}

function initialQuestion(mode: AIToolMode, value?: string) {
  if (value?.trim()) return value;
  if (mode === "simplify") return QUICK_ACTIONS[0].question;
  if (mode === "define-term") return QUICK_ACTIONS[1].question;
  return "";
}

function conversationLabel(item: AIConversation, items: AIConversation[], index: number) {
  const base = item.title || `Study conversation ${items.length - index}`;
  const duplicates = items.filter((candidate) => candidate.title === item.title);
  const duplicateCount = duplicates.length;
  if (duplicateCount < 2) return base;
  const created = new Date(item.created_at);
  if (Number.isNaN(created.getTime())) return `${base} · ${items.length - index}`;
  const timestamp = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(created);
  return `${base} · ${timestamp} · ${duplicates.findIndex((candidate) => candidate.id === item.id) + 1}/${duplicateCount}`;
}

export function AIStudyAssistantPanel({
  documentId,
  context,
  initialQuestion: suppliedQuestion,
  mode,
}: {
  documentId: string;
  context: StudyAIContext;
  initialQuestion?: string;
  mode: AIToolMode;
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [draft, setDraft] = useState(() => initialQuestion(mode, suppliedQuestion));
  const [pendingContext, setPendingContext] = useState<StudyAIContext>(context);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [retryQuestion, setRetryQuestion] = useState<string | null>(null);
  const [reconciliationRequired, setReconciliationRequired] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [savingFlashcardId, setSavingFlashcardId] = useState<string | null>(null);
  const [savedFlashcardIds, setSavedFlashcardIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  const sendAbortRef = useRef<AbortController | null>(null);
  const nearBottomRef = useRef(true);
  const requestIdRef = useRef(0);
  const incomingContextKey = JSON.stringify([
    context.source,
    context.selectedText,
    context.noteContent,
    mode,
    suppliedQuestion,
  ]);
  const [previousContextKey, setPreviousContextKey] = useState(incomingContextKey);

  if (previousContextKey !== incomingContextKey) {
    setPreviousContextKey(incomingContextKey);
    setPendingContext(context);
    setContextExpanded(false);
    const seeded = initialQuestion(mode, suppliedQuestion);
    if (seeded) setDraft(seeded);
  }

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    const node = listRef.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({ top: node.scrollHeight, behavior: reduced ? "auto" : behavior });
    nearBottomRef.current = true;
    setShowJump(false);
  }, []);

  const loadConversation = useCallback(async (
    id: string,
    token: string,
    options?: { preserveScroll?: boolean; beforeSequence?: number; forceLatest?: boolean },
  ) => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    const node = listRef.current;
    const oldHeight = node?.scrollHeight ?? 0;
    const shouldScrollToLatest = options?.forceLatest || nearBottomRef.current;
    const page = await getAIConversationMessages(id, token, {
      beforeSequence: options?.beforeSequence,
      signal: controller.signal,
    });
    if (options?.beforeSequence) {
      setMessages((current) => mergeMessages(page.messages, current));
    } else {
      setMessages(page.messages);
    }
    setNextBefore(page.next_before_sequence);
    requestAnimationFrame(() => {
      const currentNode = listRef.current;
      if (!currentNode) return;
      if (options?.preserveScroll) currentNode.scrollTop += currentNode.scrollHeight - oldHeight;
      else if (shouldScrollToLatest) scrollToLatest("auto");
      else setShowJump(true);
    });
    return page.messages;
  }, [scrollToLatest]);

  const initialize = useEffectEvent(async (requestId: number, controller: AbortController) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Your session is unavailable. Please sign in again.");
      let items = await listAIConversations(documentId, token, controller.signal);
      if (requestIdRef.current !== requestId) return;
      if (items.length === 0) {
        const created = await createAIConversation(documentId, token, controller.signal);
        items = [created];
      }
      if (requestIdRef.current !== requestId) return;
      setConversations(items);
      setConversationId(items[0].id);
      await loadConversation(items[0].id, token, { forceLatest: true });
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "Conversation could not be loaded.");
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      return;
    }
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    void initialize(requestId, controller);
    return () => {
      controller.abort();
      loadAbortRef.current?.abort();
      sendAbortRef.current?.abort();
    };
  }, [documentId, isLoaded, isSignedIn]);

  useEffect(() => {
    if (contextText(context)) requestAnimationFrame(() => composerRef.current?.focus());
  }, [context, incomingContextKey]);

  async function reloadCurrent() {
    if (!conversationId) return;
    setError(null);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Your session is unavailable.");
      await loadConversation(conversationId, token);
      setReconciliationRequired(false);
      setNotice(null);
    } catch (reloadError) {
      if (reloadError instanceof Error && reloadError.name === "AbortError") return;
      setError(reloadError instanceof Error ? reloadError.message : "Conversation could not be reloaded.");
    }
  }

  async function chooseConversation(id: string) {
    setConversationId(id);
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Your session is unavailable.");
      await loadConversation(id, token, { forceLatest: true });
      setReconciliationRequired(false);
      setNotice(null);
    } catch (loadError) {
      if (!(loadError instanceof Error && loadError.name === "AbortError")) {
        setError(loadError instanceof Error ? loadError.message : "Conversation could not be loaded.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function createNewChat() {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Your session is unavailable.");
      const created = await createAIConversation(documentId, token);
      setConversations((current) => [created, ...current]);
      setConversationId(created.id);
      setMessages([]);
      setNextBefore(null);
      setReconciliationRequired(false);
      setNotice(null);
      setDraft(initialQuestion(mode, suppliedQuestion));
      requestAnimationFrame(() => composerRef.current?.focus());
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "A new conversation could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function submit(question: string) {
    const normalized = question.trim();
    if (!normalized || !conversationId || sending || reconciliationRequired) return;
    const selected = contextText(pendingContext);
    const optimisticId = `pending-${Date.now()}`;
    const optimistic: AIChatMessage = {
      id: optimisticId,
      conversation_id: conversationId,
      sequence_number: (messages.at(-1)?.sequence_number ?? 0) + 1,
      role: "user",
      content: normalized,
      selected_text: selected ?? null,
      retrieval_mode: "document",
      suggested_followups: [],
      citations: [],
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setDraft("");
    setSending(true);
    setError(null);
    setNotice(null);
    setRetryQuestion(null);
    requestAnimationFrame(() => scrollToLatest());
    const controller = new AbortController();
    sendAbortRef.current = controller;

    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Your session is unavailable.");
      await sendAIConversationMessage(
        conversationId,
        {
          question: normalized,
          ...(selected ? { selected_text: selected } : {}),
          retrieval_mode: "document",
        },
        token,
        controller.signal,
      );
      await loadConversation(conversationId, token, { forceLatest: true });
      setReconciliationRequired(false);
      setPendingContext({ source: "general", selectedText: "" });
      setConversations((current) => current.map((item) => item.id === conversationId ? { ...item, updated_at: new Date().toISOString() } : item));
      requestAnimationFrame(() => composerRef.current?.focus());
    } catch (sendError) {
      setMessages((current) => current.filter((item) => item.id !== optimisticId));
      setDraft(normalized);
      setRetryQuestion(normalized);
      if (sendError instanceof Error && sendError.name === "AbortError") {
        setReconciliationRequired(true);
        setNotice("Stopped waiting. This response may still finish on the server. Reload before sending again.");
      } else if (
        sendError instanceof AIChatAPIError
        && sendError.status === 409
        && sendError.message === CONVERSATION_CHANGED_MESSAGE
      ) {
        setReconciliationRequired(true);
        setNotice("The conversation changed while the answer was generated. Canonical history has been reloaded; retry when ready.");
        try {
          const token = await getToken({ skipCache: true });
          if (token) {
            await loadConversation(conversationId, token);
            setReconciliationRequired(false);
          }
        } catch {
          setError("The conversation changed and could not be reloaded.");
        }
      } else if (
        sendError instanceof AIChatAPIError
        && sendError.status === 409
        && sendError.message === INDEX_PREPARING_MESSAGE
      ) {
        setNotice(sendError.message);
      } else {
        setError(sendError instanceof Error ? sendError.message : "StudFlow AI could not answer right now.");
      }
    } finally {
      sendAbortRef.current = null;
      setSending(false);
    }
  }

  async function loadEarlier() {
    if (!conversationId || !nextBefore || loadingEarlier) return;
    setLoadingEarlier(true);
    setError(null);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Your session is unavailable.");
      await loadConversation(conversationId, token, { beforeSequence: nextBefore, preserveScroll: true });
    } catch (olderError) {
      if (!(olderError instanceof Error && olderError.name === "AbortError")) {
        setError(olderError instanceof Error ? olderError.message : "Earlier messages could not be loaded.");
      }
    } finally {
      setLoadingEarlier(false);
    }
  }

  function stopWaiting() {
    sendAbortRef.current?.abort();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit(draft);
    }
  }

  async function copyMessage(message: AIChatMessage) {
    await navigator.clipboard.writeText(message.content);
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(null), 1500);
  }

  async function saveFlashcard(message: AIChatMessage, question: string, answer: string) {
    setSavingFlashcardId(message.id);
    setError(null);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Your session is unavailable.");
      await createFlashcard(documentId, { front: question, back: answer }, token);
      setSavedFlashcardIds((current) => new Set(current).add(message.id));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Flashcard could not be saved.");
    } finally {
      setSavingFlashcardId(null);
    }
  }

  const selectedContext = contextText(pendingContext);
  const panelLoading = !isLoaded || (Boolean(isSignedIn) && loading);
  const visibleError = isLoaded && !isSignedIn ? "Sign in to use StudFlow AI." : error;

  return (
    <div className="ai-chat-shell">
      <header className="ai-chat-header">
        <div className="ai-chat-thread-picker">
          <label htmlFor={`ai-conversation-${documentId}`} className="study-meta-label">Conversation</label>
          <select
            id={`ai-conversation-${documentId}`}
            value={conversationId ?? ""}
            disabled={panelLoading || sending || conversations.length === 0}
            onChange={(event) => void chooseConversation(event.target.value)}
          >
            {conversations.map((item, index) => (
              <option key={item.id} value={item.id}>{conversationLabel(item, conversations, index)}</option>
            ))}
          </select>
        </div>
        <div className="ai-chat-thread-picker">
          <label htmlFor={`ai-retrieval-mode-${documentId}`} className="study-meta-label">
            Sources
          </label>
          <select
            id={`ai-retrieval-mode-${documentId}`}
            value="document"
            aria-describedby={`ai-retrieval-mode-help-${documentId}`}
            onChange={() => undefined}
          >
            <option value="document">Document</option>
            <option value="web" disabled>Web — coming later</option>
            <option value="hybrid" disabled>Hybrid — coming later</option>
          </select>
          <span id={`ai-retrieval-mode-help-${documentId}`} className="sr-only">
            Document is selected. Web and hybrid sources are disabled until verified web grounding is available.
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void createNewChat()} disabled={creating || sending}>
          <MessageSquarePlus size={15} /> {creating ? "Creating…" : "New chat"}
        </Button>
      </header>

      {selectedContext ? (
        <section className="ai-chat-context-banner" aria-label="Pending study context">
          <div>
            <p className="study-meta-label">{contextLabel(pendingContext)}</p>
            <p className={contextExpanded ? "" : "ai-chat-context-preview"}>{selectedContext}</p>
          </div>
          <div className="ai-chat-context-actions">
            <Button type="button" variant="ghost" size="sm" onClick={() => setContextExpanded((value) => !value)}>
              {contextExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {contextExpanded ? "Collapse" : "Expand"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPendingContext({ source: "general", selectedText: "" })}>Clear</Button>
          </div>
        </section>
      ) : (
        <div className="ai-chat-document-banner"><span>Using your document</span><span>Verified chunk citations</span></div>
      )}

      <div
        ref={listRef}
        className="ai-chat-message-list"
        onScroll={(event) => {
          const node = event.currentTarget;
          const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 96;
          nearBottomRef.current = nearBottom;
          if (nearBottom) setShowJump(false);
        }}
        aria-live="polite"
        aria-busy={panelLoading || sending}
      >
        {nextBefore ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => void loadEarlier()} disabled={loadingEarlier} className="ai-chat-load-earlier">
            {loadingEarlier ? "Loading…" : "Load earlier messages"}
          </Button>
        ) : null}
        {panelLoading ? <div className="ai-chat-empty" role="status">Loading your conversation…</div> : null}
        {!panelLoading && messages.length === 0 ? (
          <div className="ai-chat-empty">
            <span className="ai-chat-empty-icon" aria-hidden="true">✦</span>
            <h4>Ask your document anything</h4>
            <p>Start a focused conversation. Answers stay grounded in the document and are saved here.</p>
          </div>
        ) : null}
        {messages.map((message, index) => {
          const preceding = message.role === "assistant" ? [...messages.slice(0, index)].reverse().find((item) => item.role === "user" && !item.id.startsWith("pending-")) : undefined;
          return (
            <AIConversationMessage
              key={message.id}
              message={message}
              precedingQuestion={preceding?.content}
              pending={message.id.startsWith("pending-")}
              copied={copiedMessageId === message.id}
              flashcardSaved={savedFlashcardIds.has(message.id)}
              flashcardSaving={savingFlashcardId === message.id}
              onCopy={() => void copyMessage(message)}
              onSaveFlashcard={(question, answer) => void saveFlashcard(message, question, answer)}
              onFollowup={(question) => void submit(question)}
            />
          );
        })}
        {sending ? <div className="ai-chat-thinking" role="status"><span aria-hidden="true" /> StudFlow is reading relevant document chunks…</div> : null}
      </div>

      {showJump ? <Button type="button" variant="outline" size="sm" className="ai-chat-jump" onClick={() => scrollToLatest()}>Jump to latest</Button> : null}
      <footer className="ai-chat-composer-shell">
        {notice ? (
          <div className="ai-chat-notice" role="status">
            <span>{notice}</span>
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={() => void reloadCurrent()}><RefreshCw size={14} /> Reload</Button>
              {retryQuestion && !reconciliationRequired ? <Button type="button" variant="ghost" size="sm" disabled={sending} onClick={() => void submit(retryQuestion)}>Retry</Button> : null}
            </div>
          </div>
        ) : null}
        {visibleError ? <div className="ai-chat-error" role="alert">{visibleError}</div> : null}
        <div className="ai-chat-quick-actions" aria-label="Quick prompts">
          {QUICK_ACTIONS.map((action) => <button key={action.label} type="button" disabled={sending || reconciliationRequired || !conversationId} onClick={() => void submit(action.question)}>{action.label}</button>)}
        </div>
        <label htmlFor={`ai-chat-composer-${documentId}`} className="sr-only">Ask a follow-up about this document</label>
        <div className="ai-chat-composer">
          <textarea
            ref={composerRef}
            id={`ai-chat-composer-${documentId}`}
            value={draft}
            maxLength={4000}
            rows={2}
            placeholder="Ask a follow-up…"
            disabled={!conversationId || panelLoading}
            onChange={(event) => {
              setDraft(event.target.value);
              setRetryQuestion(null);
            }}
            onKeyDown={handleComposerKeyDown}
          />
          {sending ? (
            <Button type="button" variant="outline" size="icon" onClick={stopWaiting} aria-label="Stop waiting for this response"><Square size={14} /></Button>
          ) : (
            <Button type="button" size="icon" onClick={() => void submit(draft)} disabled={!conversationId || reconciliationRequired || !draft.trim()} aria-label="Send message"><Send size={16} /></Button>
          )}
        </div>
        <p className="ai-chat-composer-help">Enter to send · Shift+Enter for a new line</p>
      </footer>
    </div>
  );
}
