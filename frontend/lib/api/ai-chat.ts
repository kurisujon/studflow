import { API_BASE_URL, readAPIErrorDetail } from "@/lib/api";
import type {
  AIChatAnswer,
  AIChatCitation,
  AIChatMessage,
  AIConversation,
  AIMessagePage,
} from "@/types/ai-chat";

export class AIChatAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AIChatAPIError";
  }
}

function headers(token: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path: string, token: string | null, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...headers(token), ...init?.headers },
  });
  if (!response.ok) {
    throw new AIChatAPIError(await readAPIErrorDetail(response), response.status);
  }
  return response;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function string(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Invalid AI chat ${field}.`);
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return string(value, field);
}

function conversation(value: unknown): AIConversation {
  if (!isObject(value)) throw new Error("Invalid AI conversation response.");
  return {
    id: string(value.id, "conversation id"),
    document_id: nullableString(value.document_id, "document id"),
    title: nullableString(value.title, "conversation title"),
    created_at: string(value.created_at, "created timestamp"),
    updated_at: string(value.updated_at, "updated timestamp"),
  };
}

function citation(value: unknown): AIChatCitation {
  if (!isObject(value) || typeof value.index !== "number") {
    throw new Error("Invalid AI citation response.");
  }
  if (value.source_type !== "document" && value.source_type !== "web") {
    throw new Error("Invalid AI citation source.");
  }
  return {
    index: value.index,
    source_type: value.source_type,
    title: string(value.title, "citation title"),
    url: nullableString(value.url, "citation URL"),
    document_id: nullableString(value.document_id, "citation document id"),
    chunk_id: nullableString(value.chunk_id, "citation chunk id"),
    page_number: value.page_number === null ? null : Number(value.page_number),
    excerpt: nullableString(value.excerpt, "citation excerpt"),
  };
}

function message(value: unknown): AIChatMessage {
  if (!isObject(value) || typeof value.sequence_number !== "number") {
    throw new Error("Invalid AI message response.");
  }
  if (value.role !== "user" && value.role !== "assistant" && value.role !== "system") {
    throw new Error("Invalid AI message role.");
  }
  if (value.retrieval_mode !== "document" && value.retrieval_mode !== "web" && value.retrieval_mode !== "hybrid") {
    throw new Error("Invalid AI retrieval mode.");
  }
  if (!Array.isArray(value.citations) || !Array.isArray(value.suggested_followups)) {
    throw new Error("Invalid AI message collections.");
  }
  return {
    id: string(value.id, "message id"),
    conversation_id: string(value.conversation_id, "message conversation id"),
    sequence_number: value.sequence_number,
    role: value.role,
    content: string(value.content, "message content"),
    selected_text: nullableString(value.selected_text, "selected text"),
    retrieval_mode: value.retrieval_mode,
    suggested_followups: value.suggested_followups.map((item) => string(item, "follow-up")),
    citations: value.citations.map(citation),
    created_at: string(value.created_at, "message timestamp"),
  };
}

export async function listAIConversations(
  documentId: string,
  token: string | null,
  signal?: AbortSignal,
) {
  const response = await request(
    `/api/ai/conversations?document_id=${encodeURIComponent(documentId)}`,
    token,
    { signal },
  );
  const payload: unknown = await response.json();
  if (!isObject(payload) || !Array.isArray(payload.conversations)) {
    throw new Error("Invalid AI conversation list.");
  }
  return payload.conversations.map(conversation);
}

export async function createAIConversation(
  documentId: string,
  token: string | null,
  signal?: AbortSignal,
) {
  const response = await request("/api/ai/conversations", token, {
    method: "POST",
    signal,
    body: JSON.stringify({ document_id: documentId }),
  });
  return conversation(await response.json());
}

export async function getAIConversationMessages(
  conversationId: string,
  token: string | null,
  options?: { beforeSequence?: number; signal?: AbortSignal },
): Promise<AIMessagePage> {
  const params = new URLSearchParams({ limit: "50" });
  if (options?.beforeSequence) params.set("before_sequence", String(options.beforeSequence));
  const response = await request(
    `/api/ai/conversations/${conversationId}/messages?${params}`,
    token,
    { signal: options?.signal },
  );
  const payload: unknown = await response.json();
  if (!isObject(payload) || !Array.isArray(payload.messages)) {
    throw new Error("Invalid AI message history.");
  }
  return {
    conversation: conversation(payload.conversation),
    messages: payload.messages.map(message),
    next_before_sequence:
      payload.next_before_sequence === null ? null : Number(payload.next_before_sequence),
  };
}

export async function sendAIConversationMessage(
  conversationId: string,
  payload: { question: string; selected_text?: string },
  token: string | null,
  signal?: AbortSignal,
): Promise<AIChatAnswer> {
  const response = await request(`/api/ai/conversations/${conversationId}/messages`, token, {
    method: "POST",
    signal,
    body: JSON.stringify(payload),
  });
  const value: unknown = await response.json();
  if (!isObject(value) || !Array.isArray(value.citations) || !Array.isArray(value.suggested_followups)) {
    throw new Error("Invalid AI answer response.");
  }
  return {
    conversation_id: string(value.conversation_id, "answer conversation id"),
    message_id: string(value.message_id, "answer message id"),
    answer_markdown: string(value.answer_markdown, "answer content"),
    citations: value.citations.map(citation),
    suggested_followups: value.suggested_followups.map((item) => string(item, "follow-up")),
  };
}
