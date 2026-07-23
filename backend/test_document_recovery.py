from __future__ import annotations

import unittest
import uuid
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from sqlalchemy.dialects import postgresql

from api.routes.documents import get_study_document, retry_document_processing
from core.auth import CurrentUser
from models.tables import Document, DocumentStatus, Quiz, QuizQuestion
from services.ai_service import QuizQuestionPayload
from services.documents import save_quiz


def _question_payload(index: int = 0) -> QuizQuestionPayload:
    return QuizQuestionPayload(
        question=f"Question {index}",
        options=["A", "B", "C", "D"],
        correct_answer_index=0,
        explanation="Because A is correct.",
    )


class SaveQuizRecoveryTests(unittest.TestCase):
    def test_quiz_lookup_locks_existing_orphan_for_repair(self) -> None:
        session = MagicMock()
        session.exec.return_value.first.return_value = None

        save_quiz(
            session=session,
            document_id=uuid.uuid4(),
            questions=[_question_payload()],
        )

        statement = session.exec.call_args.args[0]
        compiled = str(statement.compile(dialect=postgresql.dialect()))
        self.assertIn("FOR UPDATE", compiled)

    def test_new_quiz_parent_and_questions_use_one_commit(self) -> None:
        session = MagicMock()
        session.exec.return_value.first.return_value = None

        quiz = save_quiz(
            session=session,
            document_id=uuid.uuid4(),
            questions=[_question_payload()],
        )

        self.assertIsInstance(quiz, Quiz)
        session.flush.assert_called_once_with()
        session.add_all.assert_called_once()
        session.commit.assert_called_once_with()
        session.rollback.assert_not_called()

    def test_zero_question_quiz_is_reused(self) -> None:
        document_id = uuid.uuid4()
        orphan = Quiz(document_id=document_id)
        quiz_lookup = MagicMock()
        quiz_lookup.first.return_value = orphan
        question_lookup = MagicMock()
        question_lookup.first.return_value = None
        session = MagicMock()
        session.exec.side_effect = [quiz_lookup, question_lookup]

        result = save_quiz(
            session=session,
            document_id=document_id,
            questions=[_question_payload()],
        )

        self.assertIs(result, orphan)
        session.flush.assert_not_called()
        session.add.assert_not_called()
        session.add_all.assert_called_once()
        session.commit.assert_called_once_with()

    def test_populated_quiz_is_rejected_without_replacement(self) -> None:
        document_id = uuid.uuid4()
        quiz = Quiz(document_id=document_id)
        existing_question = QuizQuestion(
            quiz_id=quiz.id,
            question="Existing",
            options='["A", "B", "C", "D"]',
            correct_answer_index=0,
            explanation="Existing explanation",
        )
        quiz_lookup = MagicMock()
        quiz_lookup.first.return_value = quiz
        question_lookup = MagicMock()
        question_lookup.first.return_value = existing_question
        session = MagicMock()
        session.exec.side_effect = [quiz_lookup, question_lookup]

        with self.assertRaisesRegex(ValueError, "cannot be replaced"):
            save_quiz(
                session=session,
                document_id=document_id,
                questions=[_question_payload()],
            )

        session.add_all.assert_not_called()
        session.commit.assert_not_called()
        session.rollback.assert_called_once_with()

    def test_commit_failure_rolls_back_parent_and_questions(self) -> None:
        session = MagicMock()
        session.exec.return_value.first.return_value = None
        session.commit.side_effect = RuntimeError("database unavailable")

        with self.assertRaisesRegex(RuntimeError, "database unavailable"):
            save_quiz(
                session=session,
                document_id=uuid.uuid4(),
                questions=[_question_payload()],
            )

        session.flush.assert_called_once_with()
        session.add_all.assert_called_once()
        session.commit.assert_called_once_with()
        session.rollback.assert_called_once_with()


class DocumentRetryEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.document = Document(
            id=uuid.uuid4(),
            clerk_user_id="user_owner",
            filename="notes.pdf",
            file_url="documents/notes.pdf",
            status=DocumentStatus.FAILED,
        )
        self.current_user = CurrentUser(clerk_user_id="user_owner")
        self.session = MagicMock()
        self.session_context = MagicMock()
        self.session_context.__enter__.return_value = self.session

    def _session_patch(self):
        return patch(
            "api.routes.documents.Session",
            return_value=self.session_context,
        )

    def test_owner_can_claim_and_queue_failed_document(self) -> None:
        with (
            self._session_patch(),
            patch(
                "api.routes.documents._get_owned_document",
                return_value=self.document,
            ),
            patch(
                "api.routes.documents.claim_failed_document_for_retry",
                return_value=True,
            ) as claim,
            patch("api.routes.documents.process_document_task.delay") as delay,
        ):
            response = retry_document_processing(
                self.document.id,
                self.current_user,
            )

        self.assertEqual(response.document_id, self.document.id)
        self.assertEqual(response.status, DocumentStatus.PENDING.value)
        claim.assert_called_once_with(
            session=self.session,
            document_id=self.document.id,
        )
        delay.assert_called_once_with(str(self.document.id))

    def test_missing_or_non_owner_document_returns_not_found(self) -> None:
        not_found = HTTPException(status_code=404, detail="Document not found.")
        with (
            self._session_patch(),
            patch(
                "api.routes.documents._get_owned_document",
                side_effect=not_found,
            ),
            patch(
                "api.routes.documents.claim_failed_document_for_retry"
            ) as claim,
        ):
            with self.assertRaises(HTTPException) as raised:
                retry_document_processing(
                    self.document.id,
                    CurrentUser(clerk_user_id="user_other"),
                )

        self.assertEqual(raised.exception.status_code, 404)
        claim.assert_not_called()

    def test_non_failed_document_returns_conflict(self) -> None:
        self.document.status = DocumentStatus.PENDING
        with (
            self._session_patch(),
            patch(
                "api.routes.documents._get_owned_document",
                return_value=self.document,
            ),
            patch(
                "api.routes.documents.claim_failed_document_for_retry"
            ) as claim,
        ):
            with self.assertRaises(HTTPException) as raised:
                retry_document_processing(
                    self.document.id,
                    self.current_user,
                )

        self.assertEqual(raised.exception.status_code, 409)
        claim.assert_not_called()

    def test_lost_retry_claim_returns_conflict_without_enqueue(self) -> None:
        with (
            self._session_patch(),
            patch(
                "api.routes.documents._get_owned_document",
                return_value=self.document,
            ),
            patch(
                "api.routes.documents.claim_failed_document_for_retry",
                return_value=False,
            ),
            patch("api.routes.documents.process_document_task.delay") as delay,
        ):
            with self.assertRaises(HTTPException) as raised:
                retry_document_processing(
                    self.document.id,
                    self.current_user,
                )

        self.assertEqual(raised.exception.status_code, 409)
        delay.assert_not_called()

    def test_enqueue_failure_restores_failed_status(self) -> None:
        with (
            self._session_patch(),
            patch(
                "api.routes.documents._get_owned_document",
                return_value=self.document,
            ),
            patch(
                "api.routes.documents.claim_failed_document_for_retry",
                return_value=True,
            ),
            patch(
                "api.routes.documents.process_document_task.delay",
                side_effect=RuntimeError("redis unavailable"),
            ),
            patch("api.routes.documents.update_document_status") as update_status,
        ):
            with self.assertRaises(HTTPException) as raised:
                retry_document_processing(
                    self.document.id,
                    self.current_user,
                )

        self.assertEqual(raised.exception.status_code, 503)
        update_status.assert_called_once_with(
            session=self.session,
            document=self.document,
            status=DocumentStatus.FAILED,
        )

    def test_study_payload_is_blocked_until_completed(self) -> None:
        self.document.status = DocumentStatus.GENERATING
        with (
            self._session_patch(),
            patch(
                "api.routes.documents._get_owned_document",
                return_value=self.document,
            ),
        ):
            with self.assertRaises(HTTPException) as raised:
                get_study_document(self.document.id, self.current_user)

        self.assertEqual(raised.exception.status_code, 409)


if __name__ == "__main__":
    unittest.main()
