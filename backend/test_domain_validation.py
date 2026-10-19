import unittest
from schemas.domain import (
    ClaimProvenance,
    ConversationAnswerMode,
    ConversationGenerationPath,
    ConversationRequestScope,
    DomainSummary,
    DomainFlashcard,
    DomainQuizQuestion,
    DomainConversationAnswer,
    DomainGroundedClaim,
    SemanticallyValidatedAnswer,
    SemanticallyValidatedClaim,
    ValidatedCitation,
)
from services.domain_validation import (
    validate_summary,
    validate_flashcards,
    validate_quiz,
    validate_conversation_answer,
    filter_unsupported_claims,
)
from services.ai_service import (
    ComprehensiveSummary,
    FlashcardPayload,
    QuizQuestionPayload,
    ConversationAnswer,
    RawGroundedClaim,
    RawSuggestedFollowup,
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
            ],
            evidence_sufficient=True,
            suggested_followups=[" A ", " B "]
        )
        valid = validate_conversation_answer(raw, available_ids={"e_01", "e_02", "e_03"})
        self.assertEqual(len(valid.claims), 2)
        self.assertEqual(valid.claims[0].cited_evidence_ids, ["e_01", "e_02"])
        self.assertEqual(valid.claims[1].cited_evidence_ids, ["e_02", "e_03"])
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
        with self.assertRaisesRegex(ValueError, "Document claims require at least one source reference"):
            validate_conversation_answer(raw, available_ids={"e_01", "e_02"})

    def test_filter_unsupported_claims_strict_policy(self):
        answer = SemanticallyValidatedAnswer(
            claims=[
            SemanticallyValidatedClaim(
                claim_text="Supported claim",
                citations=[ValidatedCitation(evidence_id="e_01", support_level="SUPPORTED")]
            ),
            SemanticallyValidatedClaim(
                claim_text="Partial claim",
                citations=[ValidatedCitation(evidence_id="e_02", support_level="PARTIAL")]
            ),
            SemanticallyValidatedClaim(
                claim_text="Unsupported claim",
                citations=[ValidatedCitation(evidence_id="e_03", support_level="UNSUPPORTED")]
            ),
            SemanticallyValidatedClaim(
                claim_text="Mixed claim",
                citations=[
                    ValidatedCitation(evidence_id="e_04", support_level="UNSUPPORTED"),
                    ValidatedCitation(evidence_id="e_05", support_level="SUPPORTED")
                ]
            )
            ],
            evidence_sufficient=True,
            suggested_followups=[],
        )

        filtered, status = filter_unsupported_claims(answer)

        self.assertEqual(len(filtered.claims), 2)
        self.assertEqual(filtered.claims[0].claim_text, "Supported claim")
        self.assertEqual(filtered.claims[1].claim_text, "Mixed claim")
        self.assertEqual(status, "PARTIALLY_ANSWERED")

    def test_hybrid_general_explanation_accepts_uncited_established_knowledge(self):
        raw = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="The mean is the sum divided by the number of values.",
                    cited_evidence_ids=[],
                    provenance="general",
                ),
                RawGroundedClaim(
                    claim_text="For 2, 4, and 6, the mean is 4.",
                    cited_evidence_ids=[],
                    provenance="illustrative",
                ),
            ],
            evidence_sufficient=True,
            followup_candidates=[
                RawSuggestedFollowup(
                    question="How does sample standard deviation differ?",
                    answer_path="general",
                )
            ],
        )

        validated = validate_conversation_answer(
            raw,
            available_ids=set(),
            generation_path=ConversationGenerationPath.TEACHING,
        )

        self.assertEqual(validated.answer_mode, ConversationAnswerMode.GENERAL)
        self.assertEqual(
            [claim.provenance for claim in validated.claims],
            [ClaimProvenance.GENERAL, ClaimProvenance.ILLUSTRATIVE],
        )
        self.assertEqual(
            validated.suggested_followups,
            ["How does sample standard deviation differ?"],
        )

    def test_hybrid_document_claim_requires_a_valid_citation(self):
        raw = ConversationAnswer(
            answer_mode="document",
            claims=[
                RawGroundedClaim(
                    claim_text="The table reports a mean of 18.2.",
                    cited_evidence_ids=["e_99"],
                    provenance="document",
                )
            ],
            evidence_sufficient=True,
        )

        with self.assertRaisesRegex(ValueError, "Invalid Evidence ID reference: e_99"):
            validate_conversation_answer(
                raw,
                available_ids={"e_01"},
            )

    def test_hybrid_general_claim_cannot_carry_a_document_citation(self):
        raw = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="Standard deviation measures spread.",
                    cited_evidence_ids=["e_01"],
                    provenance="general",
                )
            ],
            evidence_sufficient=True,
        )

        with self.assertRaisesRegex(ValueError, "cannot cite document evidence"):
            validate_conversation_answer(
                raw,
                available_ids={"e_01"},
                generation_path=ConversationGenerationPath.TEACHING,
            )

    def test_explicit_document_only_rejects_general_and_illustrative_claims(self):
        raw = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="Here is a hypothetical calculation.",
                    cited_evidence_ids=[],
                    provenance="illustrative",
                )
            ],
            evidence_sufficient=True,
        )

        with self.assertRaisesRegex(ValueError, "Strict document generation requires document answer mode"):
            validate_conversation_answer(
                raw,
                available_ids=set(),
            )

    def test_mislabeled_general_claim_cannot_bypass_document_grounding(self):
        raw = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="The uploaded document reports a mean of 99.9.",
                    cited_evidence_ids=[],
                    provenance="general",
                )
            ],
            evidence_sufficient=True,
        )

        with self.assertRaisesRegex(ValueError, "cannot assert source-specific content"):
            validate_conversation_answer(
                raw,
                available_ids={"e_01"},
                generation_path=ConversationGenerationPath.TEACHING,
            )

    def test_indirect_source_attributions_cannot_bypass_teaching_path(self):
        for claim_text in (
            "The study reports a mean of 99.9.",
            "It reports a mean of 99.9.",
            "Our analysis found a mean of 99.9.",
            "Participants averaged 18.2.",
            "The recorded average was 18.2.",
            "In this sample, the mean was 18.2.",
            "Group Q1 had 42 participants.",
            "The results were a mean of 18.2.",
            "The dataset has a mean of 18.2.",
            "These data show a standard deviation of 4.1.",
            "The authors found a mean of 18.2.",
            "The sample had a mean of 18.2.",
            "There were 42 participants.",
            "Forty-two people took part.",
            "The mean was 18.2.",
            "Sample mean is 18.2.",
            "Q1 was 42.",
            "The methodology used a cross-sectional survey.",
            "The findings indicate a strong association.",
            "The intervention reduced anxiety.",
            "Article 3 argues that exercise improves mood.",
            "Report 2 found that scores improved.",
            "Chapter IV argues that exercise improves mood.",
            "Article IV protects freedom of expression.",
            "The paper reports a mean of 18.2.",
            "The uploaded file reports a mean of 18.2.",
        ):
            with self.subTest(claim_text=claim_text):
                raw = ConversationAnswer(
                    answer_mode="general",
                    claims=[
                        RawGroundedClaim(
                            claim_text=claim_text,
                            cited_evidence_ids=[],
                            provenance="general",
                        )
                    ],
                    evidence_sufficient=True,
                )

                with self.assertRaisesRegex(
                    ValueError,
                    "cannot assert source-specific content|Numeric teaching claims",
                ):
                    validate_conversation_answer(
                        raw,
                        available_ids=set(),
                        generation_path=ConversationGenerationPath.TEACHING,
                    )

    def test_generation_paths_reject_cross_path_claims(self):
        teaching_claim = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="A mean summarizes central tendency.",
                    cited_evidence_ids=[],
                    provenance="general",
                )
            ],
            evidence_sufficient=True,
        )
        document_claim = ConversationAnswer(
            answer_mode="document",
            claims=[
                RawGroundedClaim(
                    claim_text="The table reports a mean of 18.2.",
                    cited_evidence_ids=["e_01"],
                    provenance="document",
                )
            ],
            evidence_sufficient=True,
        )

        with self.assertRaisesRegex(ValueError, "Strict document generation"):
            validate_conversation_answer(
                teaching_claim,
                available_ids=set(),
                generation_path=ConversationGenerationPath.STRICT_DOCUMENT,
            )
        with self.assertRaisesRegex(ValueError, "Teaching generation"):
            validate_conversation_answer(
                document_claim,
                available_ids={"e_01"},
                generation_path=ConversationGenerationPath.TEACHING,
            )

    def test_model_authored_citation_markers_are_removed_before_rendering(self):
        teaching = validate_conversation_answer(
            ConversationAnswer(
                answer_mode="general",
                claims=[
                    RawGroundedClaim(
                        claim_text=(
                            "The mean is the sum divided by the count [1] [Source: 2] "
                            "[citation #3] (e_04) (Evidence: 5) [Ref 8] (ref 9)."
                        ),
                        cited_evidence_ids=[],
                        provenance="general",
                    )
                ],
                evidence_sufficient=True,
            ),
            available_ids=set(),
            generation_path=ConversationGenerationPath.TEACHING,
        )
        document = validate_conversation_answer(
            ConversationAnswer(
                answer_mode="document",
                claims=[
                    RawGroundedClaim(
                        claim_text="The table reports a mean of 18.2 [99].",
                        cited_evidence_ids=["e_01"],
                        provenance="document",
                    )
                ],
                evidence_sufficient=True,
            ),
            available_ids={"e_01"},
            generation_path=ConversationGenerationPath.STRICT_DOCUMENT,
        )

        self.assertEqual(
            teaching.claims[0].claim_text,
            "The mean is the sum divided by the count.",
        )
        self.assertNotIn("[99]", document.claims[0].claim_text)

    def test_teaching_path_allows_formulas_constants_and_numbered_steps(self):
        raw = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="For a sample, divide squared deviations by n - 1.",
                    cited_evidence_ids=[],
                    provenance="general",
                ),
                RawGroundedClaim(
                    claim_text="The empirical rule places about 68% within one standard deviation.",
                    cited_evidence_ids=[],
                    provenance="general",
                ),
                RawGroundedClaim(
                    claim_text="Step 1 is to calculate the mean.",
                    cited_evidence_ids=[],
                    provenance="general",
                ),
                RawGroundedClaim(
                    claim_text="The sample mean is calculated as x̄ = Σx / n.",
                    cited_evidence_ids=[],
                    provenance="general",
                ),
            ],
            evidence_sufficient=True,
        )

        validated = validate_conversation_answer(
            raw,
            available_ids=set(),
            generation_path=ConversationGenerationPath.TEACHING,
        )

        self.assertEqual(len(validated.claims), 4)

    def test_illustrative_statistics_are_labeled_and_not_treated_as_source_facts(self):
        raw = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text=claim_text,
                    cited_evidence_ids=[],
                    provenance="illustrative",
                )
                for claim_text in (
                    "The mean was 4.",
                    "The standard deviation was 2.",
                    "The sample mean is 4.",
                    "Their mean was 4.",
                    "Imagine a study that compares two teaching methods.",
                    "For example, researchers could compare two classrooms.",
                    "Suppose an article reports results from a fictional sample.",
                    "Consider a report with three hypothetical groups.",
                )
            ],
            evidence_sufficient=True,
        )

        validated = validate_conversation_answer(
            raw,
            available_ids=set(),
            generation_path=ConversationGenerationPath.TEACHING,
        )

        self.assertTrue(
            all(
                claim.claim_text.lower().startswith(
                    ("for example", "imagine", "suppose", "consider", "as an illustration")
                )
                for claim in validated.claims
            )
        )

    def test_illustrative_claims_reject_current_source_anchors(self):
        for claim_text in (
            "The document reports a mean of 18.2.",
            "The paper reports a mean of 18.2.",
            "Our study found a mean of 18.2.",
            "The uploaded file reports a mean of 18.2.",
        ):
            with self.subTest(claim_text=claim_text):
                raw = ConversationAnswer(
                    answer_mode="general",
                    claims=[
                        RawGroundedClaim(
                            claim_text=claim_text,
                            cited_evidence_ids=[],
                            provenance="illustrative",
                        )
                    ],
                    evidence_sufficient=True,
                )

                with self.assertRaisesRegex(ValueError, "cannot attribute facts to a source"):
                    validate_conversation_answer(
                        raw,
                        available_ids=set(),
                        generation_path=ConversationGenerationPath.TEACHING,
                    )

    def test_source_specific_question_without_evidence_rejects_general_answer(self):
        raw = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="A mean is the sum divided by the count.",
                    cited_evidence_ids=[],
                    provenance="general",
                )
            ],
            evidence_sufficient=True,
        )

        with self.assertRaisesRegex(ValueError, "Clarification generation permits"):
            validate_conversation_answer(
                raw,
                available_ids=set(),
                generation_path=ConversationGenerationPath.CLARIFICATION,
            )

    def test_ambiguous_notation_returns_targeted_clarification_without_suggestions(self):
        raw = ConversationAnswer(
            answer_mode="clarification",
            claims=[],
            evidence_sufficient=False,
            clarification_question="Which descriptives table and Q column do you mean?",
            followup_candidates=[
                RawSuggestedFollowup(
                    question="Could Q mean quartile?",
                    answer_path="general",
                )
            ],
        )

        validated = validate_conversation_answer(
            raw,
            available_ids=set(),
            generation_path=ConversationGenerationPath.CLARIFICATION,
        )

        self.assertEqual(validated.claims, [])
        self.assertEqual(validated.suggested_followups, [])
        self.assertEqual(
            validated.clarification_question,
            "Which descriptives table and Q column do you mean?",
        )

    def test_followups_require_a_viable_declared_answer_path(self):
        raw = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="A mean summarizes central tendency.",
                    cited_evidence_ids=[],
                    provenance="general",
                )
            ],
            evidence_sufficient=True,
            followup_candidates=[
                RawSuggestedFollowup(
                    question="What exact value did the table report?",
                    answer_path="document",
                    cited_evidence_ids=["e_01"],
                ),
                RawSuggestedFollowup(
                    question="What is a median?",
                    answer_path="general",
                ),
                RawSuggestedFollowup(
                    question="What was the sample size?",
                    answer_path="general",
                ),
                RawSuggestedFollowup(
                    question="What exact Q1 value was reported?",
                    answer_path="general",
                ),
            ],
        )

        validated = validate_conversation_answer(
            raw,
            available_ids={"e_01"},
            generation_path=ConversationGenerationPath.TEACHING,
        )

        self.assertEqual(validated.suggested_followups, ["What is a median?"])

    def test_hybrid_answer_mode_must_match_evidence_sufficiency(self):
        complete_but_insufficient = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="The mean describes central tendency.",
                    cited_evidence_ids=[],
                    provenance="general",
                )
            ],
            evidence_sufficient=False,
        )
        clarification_marked_complete = ConversationAnswer(
            answer_mode="clarification",
            claims=[],
            evidence_sufficient=True,
            clarification_question="Which table do you mean?",
        )

        with self.assertRaisesRegex(ValueError, "Teaching generation requires"):
            validate_conversation_answer(
                complete_but_insufficient,
                available_ids=set(),
                generation_path=ConversationGenerationPath.TEACHING,
            )
        with self.assertRaisesRegex(ValueError, "Clarification generation cannot"):
            validate_conversation_answer(
                clarification_marked_complete,
                available_ids=set(),
                generation_path=ConversationGenerationPath.CLARIFICATION,
            )

    def test_non_clarification_mode_rejects_stray_clarification_question(self):
        raw = ConversationAnswer(
            answer_mode="general",
            claims=[
                RawGroundedClaim(
                    claim_text="The mean describes central tendency.",
                    cited_evidence_ids=[],
                    provenance="general",
                )
            ],
            evidence_sufficient=True,
            clarification_question="Which table do you mean?",
        )

        with self.assertRaisesRegex(ValueError, "Teaching generation requires"):
            validate_conversation_answer(
                raw,
                available_ids=set(),
                generation_path=ConversationGenerationPath.TEACHING,
            )


if __name__ == '__main__':
    unittest.main()
