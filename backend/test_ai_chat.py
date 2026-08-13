from __future__ import annotations

import unittest
import uuid
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from pydantic import ValidationError
from fastapi import HTTPException
from sqlalchemy.dialects import postgresql

from api.routes.ai_chat import send_ai_conversation_message
from core.auth import CurrentUser
from models.tables import (
    AIConversation,
    AIMessage,
    AIMessageCitation,
    Document,
    DocumentStatus,
)
from schemas.ai_chat import SendMessageRequest
from services.ai_chat import (
    ConcurrentConversationUpdateError,
    SearchIndexNotReadyError,
    _sanitize_markers,
    create_conversation,
    delete_conversation,
    get_owned_conversation,
    list_messages,
    send_conversation_message,
    update_conversation_title,
)
from services.ai_service import AIServiceError, ConversationAnswer
from services.documents import search_owned_similar_chunks


def _context_manager(session: MagicMock) -> MagicMock:
    manager = MagicMock()
    manager.__enter__.return_value = session
    manager.__exit__.return_value = False
    return manager


class AIChatSchemaTests(unittest.TestCase):
    def test_question_is_trimmed_and_bounded(self) -> None:
        self.assertEqual(SendMessageRequest(question="  Explain routing  ").question, "Explain routing")
        with self.assertRaises(ValidationError):
            SendMessageRequest(question="   ")
        with self.assertRaises(ValidationError):
            SendMessageRequest(question="x" * 4001)

    def test_selected_text_is_trimmed_optional_and_bounded(self) -> None:
        self.assertEqual(
            SendMessageRequest(question="Explain", selected_text="  selected passage  ").selected_text,
            "selected passage",
        )
        self.assertIsNone(SendMessageRequest(question="Explain", selected_text="   ").selected_text)
        with self.assertRaises(ValidationError):
            SendMessageRequest(question="Explain", selected_text="x" * 8001)

    def test_unknown_inline_markers_are_removed(self) -> None:
        answer, referenced = _sanitize_markers("Valid [1], invalid [9].", {1, 2})
        self.assertEqual(answer, "Valid [1], invalid .")
        self.assertEqual(referenced, {1})


class AIChatOwnershipQueryTests(unittest.TestCase):
    def test_conversation_lookup_filters_clerk_owner(self) -> None:
        session = MagicMock()
        result = MagicMock()
        result.first.return_value = AIConversation(
            clerk_user_id="user_owner",
            document_id=uuid.uuid4(),
            title="Conversation",
        )
        session.exec.return_value = result

        get_owned_conversation(
            session,
            conversation_id=uuid.uuid4(),
            clerk_user_id="user_owner",
        )

        statement = session.exec.call_args.args[0]
        compiled = str(statement.compile(dialect=postgresql.dialect()))
        self.assertIn("ai_conversations.clerk_user_id", compiled)

    def test_semantic_retrieval_joins_owned_document(self) -> None:
        session = MagicMock()
        result = MagicMock()
        result.all.return_value = []
        session.exec.return_value = result

        search_owned_similar_chunks(
            session=session,
            document_id=uuid.uuid4(),
            clerk_user_id="user_owner",
            query_embedding=[0.0] * 768,
            top_k=5,
        )

        statement = session.exec.call_args.args[0]
        compiled = str(statement.compile(dialect=postgresql.dialect()))
        self.assertIn("JOIN documents", compiled)
        self.assertIn("documents.clerk_user_id", compiled)
        self.assertIn("<=>", compiled)


class AIChatConversationServiceTests(unittest.TestCase):
    def test_create_rename_and_delete_conversation(self) -> None:
        document_id = uuid.uuid4()
        document = Document(
            id=document_id,
            clerk_user_id="user_owner",
            filename="routing.pdf",
            file_url="uploads/routing.pdf",
            status=DocumentStatus.COMPLETED,
        )
        create_session = MagicMock()
        document_result = MagicMock()
        document_result.first.return_value = document
        create_session.exec.return_value = document_result

        created = create_conversation(
            create_session,
            document_id=document_id,
            clerk_user_id="user_owner",
            title=None,
        )

        self.assertEqual(created.title, "routing")
        create_session.commit.assert_called_once_with()

        conversation = create_session.add.call_args.args[0]
        rename_session = MagicMock()
        rename_result = MagicMock()
        rename_result.first.return_value = conversation
        rename_session.exec.return_value = rename_result
        renamed = update_conversation_title(
            rename_session,
            conversation_id=conversation.id,
            clerk_user_id="user_owner",
            title="Laravel routing",
        )
        self.assertEqual(renamed.title, "Laravel routing")
        rename_session.commit.assert_called_once_with()

        delete_session = MagicMock()
        delete_result = MagicMock()
        delete_result.first.return_value = conversation
        delete_session.exec.return_value = delete_result
        delete_conversation(
            delete_session,
            conversation_id=conversation.id,
            clerk_user_id="user_owner",
        )
        delete_session.delete.assert_called_once_with(conversation)
        delete_session.commit.assert_called_once_with()

    def test_message_history_is_chronological_and_hydrates_citations(self) -> None:
        conversation_id = uuid.uuid4()
        conversation = AIConversation(
            id=conversation_id,
            clerk_user_id="user_owner",
            document_id=uuid.uuid4(),
            title="Routing",
        )
        messages = [
            AIMessage(
                id=uuid.uuid4(),
                conversation_id=conversation_id,
                sequence_number=index,
                role="assistant" if index % 2 == 0 else "user",
                content=f"Message {index}",
            )
            for index in (3, 2, 1)
        ]
        citation = AIMessageCitation(
            message_id=messages[0].id,
            citation_index=1,
            source_type="document",
            title="routing.pdf",
            document_id=conversation.document_id,
            chunk_id=uuid.uuid4(),
        )
        session = MagicMock()
        conversation_result = MagicMock()
        conversation_result.first.return_value = conversation
        message_result = MagicMock()
        message_result.all.return_value = messages
        citation_result = MagicMock()
        citation_result.all.return_value = [citation]
        session.exec.side_effect = [
            conversation_result,
            message_result,
            citation_result,
        ]

        _, page, next_before = list_messages(
            session,
            conversation_id=conversation_id,
            clerk_user_id="user_owner",
            limit=2,
            before_sequence=None,
        )

        self.assertEqual([message.sequence_number for message in page], [2, 3])
        self.assertEqual(next_before, 2)
        self.assertEqual(page[-1].citations[0].chunk_id, citation.chunk_id)


class AIChatSendTests(unittest.TestCase):
    def setUp(self) -> None:
        self.document_id = uuid.uuid4()
        self.conversation_id = uuid.uuid4()
        self.updated_at = datetime.utcnow()
        self.conversation = AIConversation(
            id=self.conversation_id,
            clerk_user_id="user_owner",
            document_id=self.document_id,
            title="Routing",
            updated_at=self.updated_at,
        )
        self.document = Document(
            id=self.document_id,
            clerk_user_id="user_owner",
            filename="routing.pdf",
            file_url="uploads/routing.pdf",
            status=DocumentStatus.COMPLETED,
        )
        self.chunk = SimpleNamespace(
            id=uuid.uuid4(),
            document_id=self.document_id,
            order_index=4,
            content="Laravel routes map URLs to controller actions.",
        )

    def _read_session(self, *, readiness: tuple[int, int] = (1, 1)) -> MagicMock:
        session = MagicMock()
        conversation_result = MagicMock()
        conversation_result.first.return_value = self.conversation
        document_result = MagicMock()
        document_result.first.return_value = self.document
        readiness_result = MagicMock()
        readiness_result.one.return_value = readiness
        history_result = MagicMock()
        history_result.all.return_value = []
        session.exec.side_effect = [
            conversation_result,
            document_result,
            readiness_result,
            history_result,
        ]
        return session

    def _retrieval_session(self) -> MagicMock:
        session = MagicMock()
        conversation_result = MagicMock()
        conversation_result.first.return_value = self.conversation
        session.exec.return_value = conversation_result
        return session

    def _write_session(self, *, stale: bool = False) -> MagicMock:
        session = MagicMock()
        locked_conversation = self.conversation.model_copy(deep=True)
        if stale:
            locked_conversation.updated_at = datetime.utcnow()
        conversation_result = MagicMock()
        conversation_result.first.return_value = locked_conversation
        document_result = MagicMock()
        document_result.first.return_value = self.document
        maximum_result = MagicMock()
        maximum_result.one.return_value = 0
        session.exec.side_effect = [conversation_result, document_result, maximum_result]
        return session

    def test_success_persists_complete_turn_and_real_chunk_citation_once(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        write_session = self._write_session()
        generated = ConversationAnswer(
            answer_markdown="Routing connects a URL to application logic.[1]",
            evidence_sufficient=True,
            cited_source_indexes=[1],
            suggested_followups=["How do route parameters work?"],
        )

        with (
            patch(
                "services.ai_chat._open_session",
                side_effect=[
                    _context_manager(read_session),
                    _context_manager(retrieval_session),
                    _context_manager(write_session),
                ],
            ),
            patch("services.ai_chat.generate_query_embedding", return_value=[0.0] * 768) as embedding_mock,
            patch("services.ai_chat.search_owned_similar_chunks", return_value=[self.chunk]),
            patch("services.ai_chat.answer_conversation_question", return_value=generated) as generation_mock,
        ):
            answer = send_conversation_message(
                conversation_id=self.conversation_id,
                clerk_user_id="user_owner",
                question="What is routing?",
                selected_text="Laravel routing",
            )

        self.assertEqual(answer.citations[0].chunk_id, self.chunk.id)
        embedding_mock.assert_called_once_with("What is routing?\n\nSelected context:\nLaravel routing")
        self.assertEqual(generation_mock.call_args.kwargs["selected_text"], "Laravel routing")
        self.assertIsNone(answer.citations[0].page_number)
        self.assertIsNone(answer.citations[0].url)
        write_session.commit.assert_called_once_with()
        write_session.rollback.assert_not_called()
        added = [call.args[0] for call in write_session.add.call_args_list]
        self.assertEqual(sum(isinstance(item, AIMessage) for item in added), 2)
        user_message = next(item for item in added if isinstance(item, AIMessage) and item.role == "user")
        self.assertEqual(user_message.selected_text, "Laravel routing")

    def test_generation_failure_writes_no_partial_turn(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        with (
            patch(
                "services.ai_chat._open_session",
                side_effect=[
                    _context_manager(read_session),
                    _context_manager(retrieval_session),
                ],
            ),
            patch("services.ai_chat.generate_query_embedding", return_value=[0.0] * 768),
            patch("services.ai_chat.search_owned_similar_chunks", return_value=[self.chunk]),
            patch(
                "services.ai_chat.answer_conversation_question",
                side_effect=AIServiceError("generation failed"),
            ),
        ):
            with self.assertRaises(AIServiceError):
                send_conversation_message(
                    conversation_id=self.conversation_id,
                    clerk_user_id="user_owner",
                    question="What is routing?",
                )

        read_session.commit.assert_not_called()
        retrieval_session.commit.assert_not_called()

    def test_incomplete_index_is_rejected_before_query_embedding(self) -> None:
        read_session = self._read_session(readiness=(2, 1))

        with (
            patch(
                "services.ai_chat._open_session",
                return_value=_context_manager(read_session),
            ),
            patch("services.ai_chat.generate_query_embedding") as embedding,
        ):
            with self.assertRaises(SearchIndexNotReadyError) as raised:
                send_conversation_message(
                    conversation_id=self.conversation_id,
                    clerk_user_id="user_owner",
                    question="What is routing?",
                )

        self.assertEqual(raised.exception.document_id, self.document_id)
        self.assertTrue(raised.exception.repairable)
        embedding.assert_not_called()

    def test_stale_snapshot_rejects_concurrent_turn_before_writes(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        write_session = self._write_session(stale=True)
        generated = ConversationAnswer(
            answer_markdown="Routing connects URLs to application logic.[1]",
            evidence_sufficient=True,
            cited_source_indexes=[1],
            suggested_followups=[],
        )
        with (
            patch(
                "services.ai_chat._open_session",
                side_effect=[
                    _context_manager(read_session),
                    _context_manager(retrieval_session),
                    _context_manager(write_session),
                ],
            ),
            patch("services.ai_chat.generate_query_embedding", return_value=[0.0] * 768),
            patch("services.ai_chat.search_owned_similar_chunks", return_value=[self.chunk]),
            patch("services.ai_chat.answer_conversation_question", return_value=generated),
        ):
            with self.assertRaises(ConcurrentConversationUpdateError):
                send_conversation_message(
                    conversation_id=self.conversation_id,
                    clerk_user_id="user_owner",
                    question="What is routing?",
                )

        write_session.add.assert_not_called()
        write_session.commit.assert_not_called()

    def test_insufficient_evidence_answer_persists_without_citations(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        write_session = self._write_session()
        generated = ConversationAnswer(
            answer_markdown="The document does not contain enough information to answer that.",
            evidence_sufficient=False,
            cited_source_indexes=[],
            suggested_followups=[],
        )

        with (
            patch(
                "services.ai_chat._open_session",
                side_effect=[
                    _context_manager(read_session),
                    _context_manager(retrieval_session),
                    _context_manager(write_session),
                ],
            ),
            patch("services.ai_chat.generate_query_embedding", return_value=[0.0] * 768),
            patch("services.ai_chat.search_owned_similar_chunks", return_value=[self.chunk]),
            patch("services.ai_chat.answer_conversation_question", return_value=generated),
        ):
            answer = send_conversation_message(
                conversation_id=self.conversation_id,
                clerk_user_id="user_owner",
                question="What is the capital of Mars?",
            )

        self.assertEqual(answer.citations, [])
        write_session.commit.assert_called_once_with()
        added = [call.args[0] for call in write_session.add.call_args_list]
        self.assertFalse(any(isinstance(item, AIMessageCitation) for item in added))

    def test_blank_answer_after_marker_sanitization_is_not_persisted(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        generated = ConversationAnswer(
            answer_markdown="[9]",
            evidence_sufficient=True,
            cited_source_indexes=[1],
            suggested_followups=[],
        )

        with (
            patch(
                "services.ai_chat._open_session",
                side_effect=[
                    _context_manager(read_session),
                    _context_manager(retrieval_session),
                ],
            ),
            patch("services.ai_chat.generate_query_embedding", return_value=[0.0] * 768),
            patch("services.ai_chat.search_owned_similar_chunks", return_value=[self.chunk]),
            patch("services.ai_chat.answer_conversation_question", return_value=generated),
        ):
            with self.assertRaises(AIServiceError):
                send_conversation_message(
                    conversation_id=self.conversation_id,
                    clerk_user_id="user_owner",
                    question="What is routing?",
                )

        read_session.commit.assert_not_called()
        retrieval_session.commit.assert_not_called()

    def test_invalid_model_citation_is_an_ai_service_error(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        generated = ConversationAnswer(
            answer_markdown="Routing maps URLs.[9]",
            evidence_sufficient=True,
            cited_source_indexes=[9],
            suggested_followups=[],
        )

        with (
            patch(
                "services.ai_chat._open_session",
                side_effect=[
                    _context_manager(read_session),
                    _context_manager(retrieval_session),
                ],
            ),
            patch("services.ai_chat.generate_query_embedding", return_value=[0.0] * 768),
            patch("services.ai_chat.search_owned_similar_chunks", return_value=[self.chunk]),
            patch("services.ai_chat.answer_conversation_question", return_value=generated),
        ):
            with self.assertRaises(AIServiceError):
                send_conversation_message(
                    conversation_id=self.conversation_id,
                    clerk_user_id="user_owner",
                    question="What is routing?",
                )


class AIChatIndexRepairRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.document_id = uuid.uuid4()
        self.conversation_id = uuid.uuid4()
        self.payload = SendMessageRequest(question="What is routing?")
        self.current_user = CurrentUser(clerk_user_id="user_owner")

    def test_repairable_index_is_queued_and_returns_stable_conflict(self) -> None:
        error = SearchIndexNotReadyError(
            document_id=self.document_id,
            repairable=True,
        )
        with (
            patch("api.routes.ai_chat.send_conversation_message", side_effect=error),
            patch("api.routes.ai_chat.dispatch_document_index_repair") as dispatch,
        ):
            with self.assertRaises(HTTPException) as raised:
                send_ai_conversation_message(
                    self.conversation_id,
                    self.payload,
                    self.current_user,
                )

        dispatch.assert_called_once_with(self.document_id)
        self.assertEqual(raised.exception.status_code, 409)
        self.assertEqual(
            raised.exception.detail,
            "The document search index is being prepared. Please retry shortly.",
        )

    def test_queue_failure_returns_service_unavailable(self) -> None:
        error = SearchIndexNotReadyError(
            document_id=self.document_id,
            repairable=True,
        )
        with (
            patch("api.routes.ai_chat.send_conversation_message", side_effect=error),
            patch(
                "api.routes.ai_chat.dispatch_document_index_repair",
                side_effect=RuntimeError("redis unavailable"),
            ),
        ):
            with self.assertRaises(HTTPException) as raised:
                send_ai_conversation_message(
                    self.conversation_id,
                    self.payload,
                    self.current_user,
                )

        self.assertEqual(raised.exception.status_code, 503)

    def test_zero_chunk_index_is_not_queued(self) -> None:
        error = SearchIndexNotReadyError(
            document_id=self.document_id,
            repairable=False,
        )
        with (
            patch("api.routes.ai_chat.send_conversation_message", side_effect=error),
            patch("api.routes.ai_chat.dispatch_document_index_repair") as dispatch,
        ):
            with self.assertRaises(HTTPException) as raised:
                send_ai_conversation_message(
                    self.conversation_id,
                    self.payload,
                    self.current_user,
                )

        dispatch.assert_not_called()
        self.assertEqual(raised.exception.status_code, 409)
        self.assertIn("no extracted text", raised.exception.detail)

if __name__ == "__main__":
    unittest.main()
