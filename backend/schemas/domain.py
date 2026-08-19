import uuid
from typing import List
from pydantic import BaseModel, Field, field_validator, model_validator


class DomainTopicDetail(BaseModel):
    topic_title: str
    key_points: List[str]
    important_terms_and_definitions: List[str]

    @field_validator("topic_title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Topic title cannot be empty")
        return cleaned[:255]

    @field_validator("key_points", "important_terms_and_definitions")
    @classmethod
    def validate_lists(cls, v: List[str]) -> List[str]:
        cleaned = [item.strip() for item in v if item.strip()]
        return cleaned


class DomainSummary(BaseModel):
    overall_overview: str
    detailed_sections: List[DomainTopicDetail]

    @field_validator("overall_overview")
    @classmethod
    def validate_overview(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Overall overview cannot be empty")
        return cleaned


class DomainFlashcard(BaseModel):
    front: str
    back: str

    @field_validator("front", "back")
    @classmethod
    def validate_content(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Flashcard content cannot be empty")
        return cleaned


class DomainQuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer_index: int
    explanation: str

    @field_validator("question", "explanation")
    @classmethod
    def validate_text(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Text fields cannot be empty")
        return cleaned

    @model_validator(mode="after")
    def validate_options_and_index(self) -> "DomainQuizQuestion":
        cleaned_options = [opt.strip() for opt in self.options if opt.strip()]
        
        # We need at least 2 options
        if len(cleaned_options) < 2:
            raise ValueError("A quiz question must have at least 2 valid options")
        
        # Options must be unique (case-insensitive)
        seen = set()
        unique_opts = []
        for opt in cleaned_options:
            lower_opt = opt.lower()
            if lower_opt not in seen:
                seen.add(lower_opt)
                unique_opts.append(opt)
        
        if len(unique_opts) < 2:
             raise ValueError("A quiz question must have at least 2 unique options")

        # If deduplication removed the correct answer index or options shrunk, adjust or raise
        if self.correct_answer_index < 0 or self.correct_answer_index >= len(self.options):
            raise ValueError(f"Correct answer index {self.correct_answer_index} is out of bounds for options.")
        
        # Keep track of what the original correct answer was
        original_correct_text = self.options[self.correct_answer_index].strip()
        
        self.options = unique_opts

        # Find the new index of the correct answer
        try:
            self.correct_answer_index = self.options.index(original_correct_text)
        except ValueError:
            # If the correct answer somehow got removed (e.g. it was empty), default to 0
            self.correct_answer_index = 0

        return self


class DomainGroundedClaim(BaseModel):
    claim_text: str
    cited_evidence_ids: List[str]

    @field_validator("claim_text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Claim text cannot be empty")
        return cleaned

    @field_validator("cited_evidence_ids")
    @classmethod
    def validate_evidence(cls, v: List[str]) -> List[str]:
        cleaned = [eid.strip() for eid in v if eid.strip()]
        # Preserve order but remove exact duplicates
        seen = set()
        unique = []
        for eid in cleaned:
            if eid not in seen:
                seen.add(eid)
                unique.append(eid)
        return unique


class DomainConversationAnswer(BaseModel):
    claims: List[DomainGroundedClaim]
    evidence_sufficient: bool
    suggested_followups: List[str]

    @field_validator("suggested_followups")
    @classmethod
    def validate_followups(cls, v: List[str]) -> List[str]:
        cleaned = [followup.strip()[:160] for followup in v if followup.strip()]
        return cleaned[:4]


from enum import Enum

class CitationSupportLevel(str, Enum):
    SUPPORTED = "SUPPORTED"
    PARTIAL = "PARTIAL"
    UNSUPPORTED = "UNSUPPORTED"


class ValidatedCitation(BaseModel):
    evidence_id: str
    support_level: CitationSupportLevel

class SemanticallyValidatedClaim(BaseModel):
    claim_text: str
    citations: List[ValidatedCitation]

class SemanticallyValidatedAnswer(BaseModel):
    claims: List[SemanticallyValidatedClaim]
    evidence_sufficient: bool
    suggested_followups: List[str]

import uuid

class RetrievedEvidence(BaseModel):
    chunk_id: uuid.UUID
    content: str
    page_number: int | None
    score: float

class RetrievalQuality(BaseModel):
    top_score: float | None
    mean_top_k_score: float | None
    evidence_count: int
    threshold_passed: bool

class RetrievalEvidenceSet(BaseModel):
    evidence: list[RetrievedEvidence]
    quality: RetrievalQuality