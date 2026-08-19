import unittest
from schemas.domain import DomainSummary, DomainFlashcard, DomainQuizQuestion, DomainConversationAnswer, DomainGroundedClaim
from services.domain_validation import (
    validate_summary,
    validate_flashcards,
    validate_quiz,
    validate_conversation_answer,
)
from services.ai_service import (
    ComprehensiveSummary,
    FlashcardPayload,
    QuizQuestionPayload,
    ConversationAnswer,
    RawGroundedClaim,
)
from pydantic import ValidationError

class TestDomainValidation(unittest.TestCase):
    def test_validate_flashcards_drops_empty(self):
        raw = [
            FlashcardPayload(front="Valid Front", back="Valid Back"),
            FlashcardPayload(front="   ", back="Valid Back"),
            FlashcardPayload(front="Valid Front", back="   "),
        ]
        valid = validate_flashcards(raw)
        self.assertEqual(len(valid), 1)
        self.assertEqual(valid[0].front, "Valid Front")

    def test_validate_quiz_drops_invalid(self):
        raw = [
            # Valid question
            QuizQuestionPayload(
                question="Valid Q",
                options=["A", "B", "C", "D"],
                correct_answer_index=2,
                explanation="Valid E"
            ),
            # Invalid: Empty options after strip drop it below 2
            QuizQuestionPayload(
                question="Invalid Q",
                options=["A", "  ", "   ", "    "],
                correct_answer_index=0,
                explanation="Invalid E"
            ),
            # Invalid: Duplicate options resolved to less than 2
            QuizQuestionPayload(
                question="Invalid Q3",
                options=["A", "a", "A ", " a "],
                correct_answer_index=0,
                explanation="Invalid E3"
            ),
        ]
        valid = validate_quiz(raw)
        self.assertEqual(len(valid), 1)
        self.assertEqual(valid[0].question, "Valid Q")

    def test_validate_quiz_normalizes_correct_index(self):
        raw = [
            QuizQuestionPayload(
                question="Valid Q",
                options=["A", "B", "A", "C"],
                correct_answer_index=3, # points to "C"
                explanation="Valid E"
            ),
        ]
        valid = validate_quiz(raw)
        self.assertEqual(len(valid), 1)
        self.assertEqual(valid[0].options, ["A", "B", "C"])
        self.assertEqual(valid[0].correct_answer_index, 2)



    def test_validate_conversation_answer_valid_claims(self):
        raw = ConversationAnswer(
            claims=[
                RawGroundedClaim(claim_text="Claim 1.", cited_evidence_ids=["e_01", "e_01", "e_02"]),
                RawGroundedClaim(claim_text="Claim 2.", cited_evidence_ids=["e_02", "e_03"]),
                RawGroundedClaim(claim_text="Claim 3 no source.", cited_evidence_ids=[]),
            ],
            evidence_sufficient=True,
            suggested_followups=[" A ", " B "]
        )
        valid = validate_conversation_answer(raw, available_ids={"e_01", "e_02", "e_03"})
        self.assertEqual(len(valid.claims), 3)
        self.assertEqual(valid.claims[0].cited_evidence_ids, ["e_01", "e_02"])
        self.assertEqual(valid.claims[1].cited_evidence_ids, ["e_02", "e_03"])
        self.assertEqual(valid.claims[2].cited_evidence_ids, [])
        self.assertEqual(valid.suggested_followups, ["A", "B"])

    def test_validate_conversation_answer_drops_empty_claim(self):
        raw = ConversationAnswer(
            claims=[
                RawGroundedClaim(claim_text="   ", cited_evidence_ids=["e_01"]),
                RawGroundedClaim(claim_text="Claim 2.", cited_evidence_ids=["e_02"]),
            ],
            evidence_sufficient=True,
            suggested_followups=[]
        )
        valid = validate_conversation_answer(raw, available_ids={"e_01", "e_02"})
        self.assertEqual(len(valid.claims), 1)
        self.assertEqual(valid.claims[0].claim_text, "Claim 2.")

    def test_validate_conversation_answer_invalid_source_raises(self):
        raw = ConversationAnswer(
            claims=[
                RawGroundedClaim(claim_text="Claim 1.", cited_evidence_ids=["e_01", "e_99"]),
            ],
            evidence_sufficient=True,
            suggested_followups=[]
        )
        with self.assertRaisesRegex(ValueError, "Invalid Evidence ID reference: e_99"):
            validate_conversation_answer(raw, available_ids={"e_01", "e_02"})

    def test_validate_conversation_answer_ungrounded_raises(self):
        raw = ConversationAnswer(
            claims=[
                RawGroundedClaim(claim_text="Claim 1.", cited_evidence_ids=[]),
            ],
            evidence_sufficient=True,
            suggested_followups=[]
        )
        with self.assertRaisesRegex(ValueError, "grounded answer without any source references"):
            validate_conversation_answer(raw, available_ids={"e_01", "e_02"})

if __name__ == '__main__':
    unittest.main()
