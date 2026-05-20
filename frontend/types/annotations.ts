export type AnnotationType = "highlight" | "underline" | "note";
export type ActiveStudyTool = "select" | "highlight" | "underline" | "erase";

export type AnnotationColor =
  | "blue"
  | "yellow"
  | "green"
  | "pink"
  | "purple";

export type Annotation = {
  id: string;
  documentId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  blockId: string;
  type: AnnotationType;
  color?: AnnotationColor;
  noteContent?: string;
  createdAt: string;
  updatedAt: string;
};

export type AIExplanation = {
  selectedText: string;
  simplifiedExplanation: string;
  beginnerExplanation: string;
  example: string;
  relatedTerms: string[];
  suggestedFlashcard: {
    front: string;
    back: string;
  };
};

export type StudyBubbleTab = "notes" | "ai";
export type AIToolMode = "ask-ai" | "simplify" | "define-term";

export type SelectionState = {
  blockId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  x: number;
  y: number;
};

export type StudyNote = {
  id: string;
  annotationId?: string;
  documentId: string;
  topicIndex?: number;
  selectedText?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
