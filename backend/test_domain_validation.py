import unittest
from schemas.domain import DomainSummary, DomainFlashcard, DomainQuizQuestion, DomainConversationAnswer
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

    def test_validate_conversation_answer(self):
        raw = ConversationAnswer(
            answer_markdown="Hello",
            evidence_sufficient=True,
            cited_source_indexes=[1, 1, 2],
            suggested_followups=[" A ", " B "]
        )
        valid = validate_conversation_answer(raw, available_indexes={1, 2, 3})
        self.assertEqual(valid.cited_source_indexes, [1, 2])
        self.assertEqual(valid.suggested_followups, ["A", "B"])

    def test_validate_conversation_answer_invalid_source(self):
        raw = ConversationAnswer(
            answer_markdown="Hello",
            evidence_sufficient=True,
            cited_source_indexes=[1, 5],
            suggested_followups=[]
        )
        with self.assertRaisesRegex(ValueError, "invalid conversation source"):
            validate_conversation_answer(raw, available_indexes={1, 2})

    def test_validate_conversation_answer_ungrounded(self):
        raw = ConversationAnswer(
            answer_markdown="Hello",
            evidence_sufficient=True,
            cited_source_indexes=[],
            suggested_followups=[]
        )
        with self.assertRaisesRegex(ValueError, "grounded answer without a source"):
            validate_conversation_answer(raw, available_indexes={1, 2})

if __name__ == '__main__':
    unittest.main()
