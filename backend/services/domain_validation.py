import re

from schemas.domain import (
    CitationSupportLevel,
    DomainSummary,
    DomainTopicDetail,
    DomainFlashcard,
    DomainQuizQuestion,
    DomainConversationAnswer,
    DomainGroundedClaim,
    ClaimProvenance,
    ConversationAnswerMode,
    ConversationGenerationPath,
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

_SOURCE_UNIT_LABEL = (
    r"(?:\d+|[IVXLCDM]+|[A-Z]|one|two|three|four|five|six|seven|eight|nine|ten|"
    r"eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)"
)

_SOURCE_BOUND_GENERAL_CLAIM_PATTERNS = (
    re.compile(r"\b(?:the|this|that|our|your|my|uploaded|selected|highlighted|provided)\s+(?:document|paper|file|upload|material|source|report|article|chapter|passage|text|table|figure|chart|study)\b", re.IGNORECASE),
    re.compile(r"\b(?:selected|highlighted|provided)\s+values?\b", re.IGNORECASE),
    re.compile(r"\b(?:document|paper|file|upload|material|source|report|article|chapter|passage|table|figure|chart)\s+(?:reports?|reported|shows?|showed|states?|stated|lists?|listed|uses?|used|calculates?|calculated|defines?|defined|labels?|labeled)\b", re.IGNORECASE),
    re.compile(r"\b(?:reported|shown|stated|listed|calculated|defined|labeled)\s+(?:in|by|from)\s+(?:the|this|that|your|uploaded|selected|highlighted)?\s*(?:document|material|source|passage|table|figure|chart)\b", re.IGNORECASE),
    re.compile(r"\b(?:your|uploaded|selected|highlighted)\s+(?:reported\s+)?(?:mean|value|values|method|methodology|label|labels|result|results|q)\b", re.IGNORECASE),
    re.compile(r"\b(?:the|this|that)\s+reported\s+(?:mean|value|values|method|methodology|label|labels|result|results|q)\b", re.IGNORECASE),
    re.compile(r"\b(?:mean|value|values|method|methodology|label|labels|result|results|q)\s+(?:in|from)\s+(?:the|this|that|your|uploaded|selected|highlighted)\s+(?:document|material|source|passage|table|figure|chart)\b", re.IGNORECASE),
    re.compile(r"\b(?:a|the|this|that|our)\s+study\s+(?:reports?|reported|shows?|showed|states?|stated|found|finds)\b", re.IGNORECASE),
    re.compile(r"\bit\s+(?:reports?|reported|shows?|showed|states?|stated|found|finds)\b", re.IGNORECASE),
    re.compile(r"\bour\s+analysis\s+(?:reports?|reported|shows?|showed|states?|stated|found|finds)\b", re.IGNORECASE),
    re.compile(r"\b(?:participants?|respondents?|subjects?|authors?|researchers?)\s+(?:averaged|had|were|found|reported|showed)\b", re.IGNORECASE),
    re.compile(r"\b(?:the\s+)?recorded\s+(?:average|mean|value|result|results)\b", re.IGNORECASE),
    re.compile(r"\b(?:in\s+)?(?:this|the|our)\s+(?:dataset|data|study|analysis|experiment|survey)\b", re.IGNORECASE),
    re.compile(r"\bin\s+(?:this|the|our)\s+sample\b", re.IGNORECASE),
    re.compile(r"\b(?:the|these|those|our)\s+(?:results?|data|dataset|authors?|researchers?|participants?)\b", re.IGNORECASE),
    re.compile(r"\b(?:sample|dataset|data|results?)\s+(?:had|has|were|was|shows?|showed|indicates?|indicated|yielded)\b", re.IGNORECASE),
    re.compile(r"\bgroup\s+[A-Za-z0-9_-]+\s+(?:had|has|reported|showed)\b", re.IGNORECASE),
    re.compile(rf"\b(?:report|article|chapter|section|page)\s+{_SOURCE_UNIT_LABEL}\b", re.IGNORECASE),
    re.compile(r"\b(?:the\s+)?(?:methodology|method)\s+(?:used|employed|included|was)\b", re.IGNORECASE),
    re.compile(r"\b(?:the\s+)?findings?\s+(?:indicate|indicated|show|showed|suggest|suggested|reveal|revealed)\b", re.IGNORECASE),
    re.compile(r"\b(?:the\s+)?intervention\s+(?:reduced|increased|improved|worsened|caused|resulted)\b", re.IGNORECASE),
    re.compile(r"\b(?:there|it)\s+(?:was|were)\b", re.IGNORECASE),
    re.compile(r"\b(?:sample mean|q\d+)\s+(?:was|were|equaled)\b", re.IGNORECASE),
    re.compile(r"\b(?:sample mean|q\d+)\s+is\s+(?=[-+]?\d)", re.IGNORECASE),
    re.compile(r"\b(?:mean|average|median|standard deviation|variance)\s+(?:was|were|equaled)\b", re.IGNORECASE),
    re.compile(r"\b(?:people|participants?|respondents?|subjects?)\s+(?:took part|were included|participated)\b", re.IGNORECASE),
)

_SOURCE_SPECIFIC_QUESTION_PATTERNS = (
    re.compile(r"\baccording to\s+(?:this|the|my)\s+(?:uploaded\s+)?(?:document|material|source|upload|paper)\b", re.IGNORECASE),
    re.compile(r"\bbased on\s+(?:this|the|my)\s+(?:uploaded\s+)?(?:document|material|source|upload|paper)\b", re.IGNORECASE),
    re.compile(r"\b(?:in|from|does)\s+(?:this|the|my)\s+(?:uploaded\s+)?(?:document|material|source|paper)\b", re.IGNORECASE),
    re.compile(r"\b(?:the|this|that|my|your|uploaded|selected|highlighted)\s+(?:document|paper|report|article|chapter|passage|table|figure|chart)\b", re.IGNORECASE),
    re.compile(r"\b(?:this|that|my|your|uploaded|selected|highlighted)\s+(?:material|source)\b", re.IGNORECASE),
    re.compile(r"\bdescriptives?\s+table\b", re.IGNORECASE),
    re.compile(r"\b(?:mean|value|values|method|label|labels|q)\s+(?:in|from)\s+(?:the|this|that|my|your)\s+(?:table|document|paper|figure|chart|passage)\b", re.IGNORECASE),
    re.compile(r"\bwhat\s+(?:was|were)\s+(?:the\s+)?(?:average|sample mean|sample size|reported mean|reported value|recorded mean|methodology|method|result|results|q\d*)\b", re.IGNORECASE),
    re.compile(r"\bwhat\s+(?:methodology|method)\s+was\s+used\b", re.IGNORECASE),
    re.compile(r"\b(?:who\s+were|how many)\s+(?:the\s+)?(?:participants|respondents|subjects)(?:\s+were\s+there)?\b", re.IGNORECASE),
    re.compile(r"\bwhat\s+did\s+(?:the\s+)?(?:authors?|researchers?|study|paper|report|article|chapter|results?|dataset|data)\s+(?:find|report|show|conclude)\b", re.IGNORECASE),
    re.compile(r"\bwhat\s+does\s+(?:the\s+)?(?:dataset|data|results?|paper|report|article|chapter|study|table|figure|chart)\s+(?:say|show|report|indicate|mean)\b", re.IGNORECASE),
    re.compile(r"\bhow\s+was\s+.+\s+(?:calculated|computed|measured|derived|determined|selected|recruited)\b", re.IGNORECASE),
    re.compile(r"\bhow\s+did\s+(?:the\s+)?(?:study|paper|authors?|researchers?)\s+(?:calculate|compute|measure|derive|determine|select|recruit)\b", re.IGNORECASE),
    re.compile(r"\bwhat\s+(?:exact\s+)?[A-Za-z0-9_-]+\s+value\s+was\s+reported\b", re.IGNORECASE),
    re.compile(r"^(?:describe|summarize|characterize)\s+(?:the|this)\s+(?:sample|participants?|respondents?|subjects?|method|methodology|results?)\b", re.IGNORECASE),
    re.compile(r"^(?:explain|describe|summarize|characterize)\s+(?:how\s+)?(?:the\s+)?(?:report|article|chapter|methodology|methods?|findings?|results?|sample|participants?|respondents?|subjects?|intervention|dataset|data|analysis|procedure)\b", re.IGNORECASE),
    re.compile(r"\b(?:participants?|respondents?|subjects?)\s+were\s+(?:selected|included|excluded|recruited)\b", re.IGNORECASE),
    re.compile(rf"\b(?:report|article|chapter|section|page)\s+{_SOURCE_UNIT_LABEL}\b", re.IGNORECASE),
)

_MODEL_CITATION_MARKER = re.compile(
    r"(?:\[\s*(?:e_)?\d+(?:\s*,\s*(?:e_)?\d+)*\s*\]|"
    r"\[(?=[^\]\n]{0,50}\d)(?=[^\]\n]{0,50}(?:source|citation|evidence|reference|ref|e_))[^\]\n]+\]|"
    r"\((?=[^)\n]{0,50}\d)(?=[^)\n]{0,50}(?:source|citation|evidence|reference|ref|e_))[^)\n]+\)|"
    r"【[^】\n]*\d+[^】\n]*】)",
    re.IGNORECASE,
)
_CURRENT_SOURCE_ATTRIBUTION = re.compile(
    r"\b(?:uploaded|selected|highlighted|provided)\b|"
    r"\b(?:the|this|that|our|your|my)\s+(?:document|paper|file|upload|source|passage|table|figure|chart|study|report|article|chapter|section|page)\b",
    re.IGNORECASE,
)
_ILLUSTRATIVE_PREFIX = re.compile(
    r"^(?:(?:for example|imagine|suppose|consider|as an illustration)\b|for\s+\d)",
    re.IGNORECASE,
)


def _claim_refers_to_source_content(claim_text: str) -> bool:
    return any(
        pattern.search(claim_text)
        for pattern in _SOURCE_BOUND_GENERAL_CLAIM_PATTERNS
    )


def question_requires_document_evidence(question: str) -> bool:
    """Identify questions whose answer depends on the selected document."""
    return any(pattern.search(question) for pattern in _SOURCE_SPECIFIC_QUESTION_PATTERNS)


def _strip_model_citation_markers(claim_text: str) -> str:
    """Keep visible citation markers under deterministic renderer control."""
    cleaned = _MODEL_CITATION_MARKER.sub("", claim_text)
    return re.sub(r"\s+([.,;:!?])", r"\1", cleaned).strip()

def _validated_hybrid_followups(
    raw: ConversationAnswer,
    available_ids: Set[str],
) -> list[str]:
    """Return only follow-ups whose declared answer path is deterministically viable."""
    validated: list[str] = []
    for candidate in raw.followup_candidates:
        # An evidence ID proves existence, not that a proposed document question is
        # answerable. Until question/evidence support has its own validator, fail closed.
        if candidate.answer_path == "document":
            continue
        evidence_ids = list(dict.fromkeys(
            evidence_id.strip()
            for evidence_id in candidate.cited_evidence_ids
            if evidence_id.strip()
        ))
        invalid_ids = [evidence_id for evidence_id in evidence_ids if evidence_id not in available_ids]
        if invalid_ids:
            raise ValueError(f"Invalid Evidence ID reference: {invalid_ids[0]}")
        question = candidate.question.strip()[:160]
        if candidate.answer_path == "general" and (
            evidence_ids
            or _claim_refers_to_source_content(question)
            or question_requires_document_evidence(question)
        ):
            continue
        if question and question not in validated:
            validated.append(question)
    return validated[:4]


def validate_conversation_answer(
    raw: ConversationAnswer,
    available_ids: Set[str],
    *,
    generation_path: ConversationGenerationPath = ConversationGenerationPath.STRICT_DOCUMENT,
) -> DomainConversationAnswer:
    """Constrain a model proposal to the deterministic caller-selected path."""

    valid_claims = []
    has_citations = False

    for raw_claim in raw.claims:
        try:
            domain_claim = DomainGroundedClaim(
                claim_text=_strip_model_citation_markers(raw_claim.claim_text),
                cited_evidence_ids=raw_claim.cited_evidence_ids,
                provenance=raw_claim.provenance,
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

    answer_mode = ConversationAnswerMode(raw.answer_mode)
    clarification_question = raw.clarification_question

    if generation_path == ConversationGenerationPath.STRICT_DOCUMENT:
        if (
            answer_mode == ConversationAnswerMode.DOCUMENT
            and not raw.evidence_sufficient
            and not has_citations
        ):
            # Backward-compatible normalization for an older structured refusal.
            answer_mode = ConversationAnswerMode.INSUFFICIENT
            valid_claims = []
        if answer_mode == ConversationAnswerMode.INSUFFICIENT:
            if raw.evidence_sufficient or clarification_question:
                raise ValueError("Insufficient document answers cannot be complete or ask a clarification.")
            return DomainConversationAnswer(
                claims=[],
                evidence_sufficient=False,
                suggested_followups=[],
                answer_mode=answer_mode,
                generation_path=generation_path,
            )
        if answer_mode != ConversationAnswerMode.DOCUMENT or not raw.evidence_sufficient:
            raise ValueError("Strict document generation requires document answer mode.")
        if clarification_question:
            raise ValueError("Strict document answers cannot include a clarification question.")
        if not valid_claims or any(
            claim.provenance != ClaimProvenance.DOCUMENT
            for claim in valid_claims
        ):
            raise ValueError("Strict document generation permits only document claims.")
        if any(not claim.cited_evidence_ids for claim in valid_claims):
            raise ValueError("Document claims require at least one source reference.")
        # Preserve the legacy strict-validator contract. The conversation
        # orchestrator clears these untyped suggestions before persistence.
        suggested_followups = raw.suggested_followups
    elif generation_path == ConversationGenerationPath.TEACHING:
        if answer_mode != ConversationAnswerMode.GENERAL or not raw.evidence_sufficient:
            raise ValueError("Teaching generation requires a complete general answer.")
        if clarification_question or not valid_claims:
            raise ValueError("Teaching generation requires claims and no clarification question.")
        for index, claim in enumerate(valid_claims):
            if claim.provenance not in {ClaimProvenance.GENERAL, ClaimProvenance.ILLUSTRATIVE}:
                raise ValueError("Teaching generation permits only general or illustrative claims.")
            if claim.cited_evidence_ids:
                raise ValueError("Teaching claims cannot cite document evidence.")
            if claim.provenance == ClaimProvenance.ILLUSTRATIVE:
                if _CURRENT_SOURCE_ATTRIBUTION.search(claim.claim_text):
                    raise ValueError("Illustrative claims cannot attribute facts to a source.")
                if not _ILLUSTRATIVE_PREFIX.search(claim.claim_text):
                    claim = claim.model_copy(
                        update={"claim_text": f"For example, {claim.claim_text}"}
                    )
                    valid_claims[index] = claim
            elif _claim_refers_to_source_content(claim.claim_text):
                raise ValueError("Teaching claims cannot assert source-specific content.")
        suggested_followups = _validated_hybrid_followups(raw, set())
    elif generation_path == ConversationGenerationPath.CLARIFICATION:
        if (
            answer_mode == ConversationAnswerMode.DOCUMENT
            and not raw.evidence_sufficient
            and not has_citations
        ):
            # Accept the legacy structured refusal shape, but discard its
            # ungrounded explanatory claim before persistence.
            answer_mode = ConversationAnswerMode.INSUFFICIENT
            valid_claims = []
        if answer_mode not in {
            ConversationAnswerMode.CLARIFICATION,
            ConversationAnswerMode.INSUFFICIENT,
        }:
            raise ValueError("Clarification generation permits only clarification or insufficient mode.")
        if raw.evidence_sufficient or valid_claims or has_citations:
            raise ValueError("Clarification generation cannot include claims or citations.")
        if answer_mode == ConversationAnswerMode.CLARIFICATION and not clarification_question:
            raise ValueError("Clarification mode requires a targeted question.")
        if answer_mode == ConversationAnswerMode.INSUFFICIENT and clarification_question:
            raise ValueError("Insufficient mode cannot include a clarification question.")
        return DomainConversationAnswer(
            claims=[],
            evidence_sufficient=False,
            suggested_followups=[],
            answer_mode=answer_mode,
            clarification_question=clarification_question,
            generation_path=generation_path,
        )
    else:
        raise ValueError("Composite answers must be assembled from independently validated paths.")

    return DomainConversationAnswer(
        claims=valid_claims,
        evidence_sufficient=raw.evidence_sufficient,
        suggested_followups=suggested_followups,
        answer_mode=answer_mode,
        clarification_question=clarification_question,
        generation_path=generation_path,
    )

from schemas.domain import (
    CitationSupportLevel,
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
            support_level_str = eval_map.get((claim.claim_text, eid), "UNSUPPORTED")
            try:
                support_level = CitationSupportLevel(support_level_str)
            except ValueError:
                support_level = CitationSupportLevel.UNSUPPORTED

            valid_citations.append(
                ValidatedCitation(evidence_id=eid, support_level=support_level)
            )

        semantically_valid_claims.append(
            SemanticallyValidatedClaim(
                claim_text=claim.claim_text,
                citations=valid_citations,
                provenance=claim.provenance,
            )
        )

    return SemanticallyValidatedAnswer(
        claims=semantically_valid_claims,
        evidence_sufficient=structurally_valid.evidence_sufficient,
        suggested_followups=structurally_valid.suggested_followups,
        answer_mode=structurally_valid.answer_mode,
        clarification_question=structurally_valid.clarification_question,
        generation_path=structurally_valid.generation_path,
    )

from schemas.ai_chat import ChatAnswerStatus
from schemas.domain import CitationSupportLevel

def filter_unsupported_claims(
    answer: SemanticallyValidatedAnswer,
) -> tuple[SemanticallyValidatedAnswer, ChatAnswerStatus]:
    if answer.generation_path == ConversationGenerationPath.CLARIFICATION and answer.answer_mode == ConversationAnswerMode.CLARIFICATION:
        return answer.model_copy(update={"suggested_followups": []}), ChatAnswerStatus.PARTIALLY_ANSWERED
    if answer.answer_mode == ConversationAnswerMode.INSUFFICIENT:
        return answer.model_copy(update={"suggested_followups": []}), ChatAnswerStatus.INSUFFICIENT_EVIDENCE

    original_count = len(answer.claims)
    if original_count == 0:
        return answer, ChatAnswerStatus.INSUFFICIENT_EVIDENCE

    kept_claims = []
    for claim in answer.claims:
        if answer.generation_path == ConversationGenerationPath.TEACHING and claim.provenance in {
            ClaimProvenance.GENERAL,
            ClaimProvenance.ILLUSTRATIVE,
        }:
            kept_claims.append(claim)
            continue
        valid_citations = [
            c for c in claim.citations
            if c.support_level == CitationSupportLevel.SUPPORTED
        ]

        if valid_citations:
            kept_claims.append(
                SemanticallyValidatedClaim(
                    claim_text=claim.claim_text,
                    citations=valid_citations,
                    provenance=claim.provenance,
                )
            )

    filtered_answer = SemanticallyValidatedAnswer(
        claims=kept_claims,
        evidence_sufficient=answer.evidence_sufficient,
        suggested_followups=answer.suggested_followups,
        answer_mode=answer.answer_mode,
        clarification_question=answer.clarification_question,
        generation_path=answer.generation_path,
    )

    if len(kept_claims) == 0:
        status = ChatAnswerStatus.INSUFFICIENT_EVIDENCE
    elif len(kept_claims) < original_count:
        status = ChatAnswerStatus.PARTIALLY_ANSWERED
    else:
        status = ChatAnswerStatus.ANSWERED

    if status != ChatAnswerStatus.ANSWERED:
        filtered_answer = filtered_answer.model_copy(update={"suggested_followups": []})

    return filtered_answer, status
