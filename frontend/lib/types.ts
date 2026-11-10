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

export type SummaryLibraryItem = {
  document_id: string;
  filename: string;
  document_created_at: string;
  summary_created_at: string;
  page_count: number | null;
  overview: string;
  topics: string[];
  key_takeaways: string[];
  important_terms: string[];
  topic_count: number;
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

export type UserRole = "admin" | "user";
export type AccountAccessState = "active" | "pending" | "suspended";

export type UserAccessStatus = {
  clerk_user_id: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  is_admin: boolean;
  approved: boolean;
  suspended: boolean;
  status: AccountAccessState;
};

export type ManagedUser = {
  clerk_user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  image_url: string | null;
  role: UserRole;
  approved: boolean;
  suspended: boolean;
  status: AccountAccessState;
  created_at: string | null;
  last_sign_in_at: string | null;
};

export type PendingInvitation = {
  id: string;
  email_address: string;
  role: UserRole;
  status: string;
  created_at: string | null;
  expires_at: string | null;
};

export type AdminUserSummaryCounts = {
  total_users: number;
  active_users: number;
  pending_users: number;
  suspended_users: number;
  admin_users: number;
  pending_invitations: number;
};

export type AdminUsersOverview = {
  users: ManagedUser[];
  invitations: PendingInvitation[];
  counts: AdminUserSummaryCounts;
};
