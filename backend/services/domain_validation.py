from schemas.domain import (
    DomainSummary,
    DomainTopicDetail,
    DomainFlashcard,
    DomainQuizQuestion,
    DomainConversationAnswer,
    DomainGroundedClaim,
)
from services.ai_service import (
    ComprehensiveSummary,
    FlashcardPayload,
    QuizQuestionPayload,
    ConversationAnswer,
)


def validate_summary(raw: ComprehensiveSummary) -> DomainSummary:
    """Validates and sanitizes a raw ComprehensiveSummary from the LLM."""
    return DomainSummary(
        overall_overview=raw.overall_overview,
        detailed_sections=[
            DomainTopicDetail(
                topic_title=topic.topic_title,
                key_points=topic.key_points,
                important_terms_and_definitions=topic.important_terms_and_definitions,
            )
            for topic in raw.detailed_sections
        ],
    )


def validate_flashcards(raw_flashcards: list[FlashcardPayload]) -> list[DomainFlashcard]:
    """Validates, sanitizes, and filters a list of raw FlashcardPayloads."""
    valid_cards = []
    for raw in raw_flashcards:
        try:
            valid_cards.append(
                DomainFlashcard(
                    front=raw.front,
                    back=raw.back,
                )
            )
        except ValueError:
            # Drop invalid flashcards
            continue
    return valid_cards


def validate_quiz(raw_quiz: list[QuizQuestionPayload]) -> list[DomainQuizQuestion]:
    """Validates, sanitizes, and filters a list of raw QuizQuestionPayloads."""
    valid_questions = []
    for raw in raw_quiz:
        try:
            valid_questions.append(
                DomainQuizQuestion(
                    question=raw.question,
                    options=raw.options,
                    correct_answer_index=raw.correct_answer_index,
                    explanation=raw.explanation,
                )
            )
        except ValueError:
            # Drop invalid questions
            continue
    return valid_questions


from typing import Set

def validate_conversation_answer(raw: ConversationAnswer, available_ids: Set[str]) -> DomainConversationAnswer:
    """Validates and sanitizes a raw ConversationAnswer."""
    
    valid_claims = []
    has_citations = False
    
    for raw_claim in raw.claims:
        try:
            domain_claim = DomainGroundedClaim(
                claim_text=raw_claim.claim_text,
                cited_evidence_ids=raw_claim.cited_evidence_ids,
            )
        except ValueError:
            # Skip claims that fail structural validation (e.g. empty strings)
            continue
            
        # Basic B1/B2 check: were these IDs even supplied?
        for eid in domain_claim.cited_evidence_ids:
            if eid not in available_ids:
                raise ValueError(f"Invalid Evidence ID reference: {eid}")
        
        if domain_claim.cited_evidence_ids:
            has_citations = True
            
        valid_claims.append(domain_claim)

    if raw.evidence_sufficient and not has_citations:
        raise ValueError("Gemini returned a grounded answer without any source references.")
        
    if not valid_claims:
        raise ValueError("Gemini returned an answer with no valid claims.")

    return DomainConversationAnswer(
        claims=valid_claims,
        evidence_sufficient=raw.evidence_sufficient,
        suggested_followups=raw.suggested_followups,
    )

from schemas.domain import (
    SemanticallyValidatedAnswer,
    SemanticallyValidatedClaim,
    ValidatedCitation,
)
from services.ai_service import RawCitationEvaluation

def apply_semantic_validation(
    structurally_valid: DomainConversationAnswer,
    evaluations: list[RawCitationEvaluation]
) -> SemanticallyValidatedAnswer:
    # Map eval results for quick lookup: (claim_text, evidence_id) -> support_level
    eval_map = {
        (ev.claim_text, ev.evidence_id): ev.support_level 
        for ev in evaluations
    }
    
    semantically_valid_claims = []
    
    for claim in structurally_valid.claims:
        valid_citations = []
        for eid in claim.cited_evidence_ids:
            support_level = eval_map.get((claim.claim_text, eid), "UNSUPPORTED")
            valid_citations.append(
                ValidatedCitation(evidence_id=eid, support_level=support_level)
            )
            
        semantically_valid_claims.append(
            SemanticallyValidatedClaim(
                claim_text=claim.claim_text,
                citations=valid_citations
            )
        )
        
    return SemanticallyValidatedAnswer(
        claims=semantically_valid_claims,
        evidence_sufficient=structurally_valid.evidence_sufficient,
        suggested_followups=structurally_valid.suggested_followups
    )
