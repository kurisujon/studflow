export type DocumentListItem = {
  id: string;
  filename: string;
  status: DocumentProcessingStatus;
  created_at: string;
  updated_at: string;
  page_count: number | null;
  summary_ready: boolean;
  flashcard_count: number;
  quiz_ready: boolean;
};

export type DocumentProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "EXTRACTING"
  | "CHUNKING"
  | "EMBEDDING"
  | "ANALYZING"
  | "GENERATING"
  | "VALIDATING"
  | "COMPLETED"
  | "FAILED";

export type StudyFlashcard = {
  id: string;
  front: string;
  back: string;
  order_index: number;
  next_review_date: string;
  interval: number;
  repetition: number;
  easiness_factor: number;
};

export type StudyQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  order_index: number;
};

export type QuizAttemptSummary = {
  id: string;
  documentId: string;
  score: number;
  totalQuestions: number;
  incorrectQuestionIds: string[];
  createdAt: string;
};

export type StudyDocument = {
  id: string;
  filename: string;
  status: DocumentProcessingStatus;
  created_at: string;
  summary: string | null;
  summary_data: {
    overall_overview: string;
    detailed_sections: Array<{
      topic_title: string;
      key_points: string[];
      important_terms_and_definitions: string[];
    }>;
  } | null;
  flashcards: StudyFlashcard[];
  quiz: StudyQuizQuestion[];
};

export type UserStats = {
  total_documents: number;
  total_flashcards: number;
  avg_quiz_score: number;
  streak_days: number;
  streak_activity: boolean[];
};

export type QueueItem = {
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  text_color: string;
};

export type UserQueue = {
  tasks: QueueItem[];
};

export type UserPreferences = {
  id: string;
  theme: string;
  daily_review_goal: number;
  sm2_aggressiveness: number;
};
