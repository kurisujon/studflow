export type AIRetrievalMode = "document" | "web" | "hybrid";
export type AIChatAnswerStatus =
  | "ANSWERED"
  | "PARTIALLY_ANSWERED"
  | "INSUFFICIENT_EVIDENCE"
  | "OUT_OF_SCOPE"
  | "FAILED";

export type AIMessageRole = "user" | "assistant" | "system";

export type AIConversation = {
  id: string;
  document_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type AIChatCitation = {
  index: number;
  source_type: "document" | "web";
  title: string;
  url: string | null;
  document_id: string | null;
  chunk_id: string | null;
  page_number: number | null;
  excerpt: string | null;
};

export type AIChatMessage = {
  id: string;
  conversation_id: string;
  sequence_number: number;
  role: AIMessageRole;
  content: string;
  selected_text: string | null;
  retrieval_mode: AIRetrievalMode;
  suggested_followups: string[];
  citations: AIChatCitation[];
  status: AIChatAnswerStatus;
  created_at: string;
};

export type AIMessagePage = {
  conversation: AIConversation;
  messages: AIChatMessage[];
  next_before_sequence: number | null;
};

export type AIChatAnswer = {
  conversation_id: string;
  message_id: string;
  answer_markdown: string;
  citations: AIChatCitation[];
  suggested_followups: string[];
  status: AIChatAnswerStatus;
};
