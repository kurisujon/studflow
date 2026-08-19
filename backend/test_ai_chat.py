from __future__ import annotations

import unittest
import uuid
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from pydantic import ValidationError
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.dialects import postgresql
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, select

from api.routes.ai_chat import send_ai_conversation_message
from core.auth import CurrentUser
from models.tables import (
    AIConversation,
    AIMessage,
    AIMessageCitation,
    Document,
    DocumentChunk,
    DocumentStatus,
)
from schemas.ai_chat import SendMessageRequest
from services.ai_chat import (
    ConcurrentConversationUpdateError,
    INSUFFICIENT_EVIDENCE_ANSWER,
    SearchIndexNotReadyError,
    _get_owned_document,
    create_conversation,
    delete_conversation,
    get_owned_conversation,
    list_messages,
    send_conversation_message,
    update_conversation_title,
)
from services.ai_service import (
    AIServiceError,
    ConversationAnswer,
    RawGroundedClaim,
    answer_conversation_question,
)
from services.documents import search_owned_similar_chunks


def _context_manager(session: MagicMock) -> MagicMock:
    manager = MagicMock()
    manager.__enter__.return_value = session
    manager.__exit__.return_value = False
    return manager


class AIChatSchemaTests(unittest.TestCase):
    def test_retrieval_mode_defaults_to_document(self) -> None:
        self.assertEqual(
            SendMessageRequest(question="Explain routing").retrieval_mode,
            "document",
        )

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

class AIChatGenerationTests(unittest.TestCase):
    def setUp(self) -> None:
        from services.ai_service import RawGroundedClaim
        self.valid_response = SimpleNamespace(
            text=ConversationAnswer(
                claims=[
                    RawGroundedClaim(claim_text="Routing maps URLs to application logic.", cited_evidence_ids=["e_01"])
                ],
                evidence_sufficient=True,
                suggested_followups=[],
            ).model_dump_json()
        )

    def _answer(self) -> ConversationAnswer:
        return answer_conversation_question(
            sources=[("e_01", "Routing maps URLs to controller actions.")],
            user_question="What is routing?",
            conversation_history=[],
        )

    def test_malformed_response_is_retried_once_then_valid_response_is_returned(self) -> None:
        malformed_response = SimpleNamespace(text='{"claims":')

        with (
            patch(
                "services.ai_service._generate_structured",
                side_effect=[malformed_response, self.valid_response],
            ) as generation,
            patch("services.ai_service.logger.warning") as warning,
        ):
            answer = self._answer()

        self.assertEqual(answer.claims[0].claim_text, "Routing maps URLs to application logic.")
        self.assertEqual(generation.call_count, 2)
        warning.assert_called_once_with(
            "Retrying malformed conversation answer: attempt=%d error_type=%s",
            1,
            "ValidationError",
        )

    def test_two_malformed_responses_raise_stable_ai_service_error(self) -> None:
        malformed_response = SimpleNamespace(text='{"claims":')

        with patch(
            "services.ai_service._generate_structured",
            side_effect=[malformed_response, malformed_response],
        ) as generation:
            with self.assertRaisesRegex(
                AIServiceError,
                "Gemini returned an invalid structured conversation answer after retry.",
            ) as raised:
                self._answer()

        self.assertEqual(generation.call_count, 2)
        self.assertIsInstance(raised.exception.__cause__, ValidationError)

    def test_valid_response_uses_one_structured_generation_call(self) -> None:
        with patch(
            "services.ai_service._generate_structured",
            return_value=self.valid_response,
        ) as generation:
            answer = self._answer()

        self.assertTrue(answer.evidence_sufficient)
        generation.assert_called_once()


class AIChatOwnershipQueryTests(unittest.TestCase):
    def test_final_document_lookup_uses_row_lock_and_refreshes_cached_state(self) -> None:
        session = MagicMock()
        result = MagicMock()
        result.first.return_value = Document(
            clerk_user_id="user_owner",
            filename="routing.pdf",
            file_url="uploads/routing.pdf",
            status=DocumentStatus.COMPLETED,
        )
        session.exec.return_value = result

        _get_owned_document(
            session,
            document_id=uuid.uuid4(),
            clerk_user_id="user_owner",
            for_update=True,
        )

        statement = session.exec.call_args.args[0]
        compiled = str(statement.compile(dialect=postgresql.dialect()))
        self.assertIn("FOR UPDATE", compiled)
        self.assertTrue(statement.get_execution_options().get("populate_existing"))

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
            page_number=7,
            index_generation=1,
        )

    def _read_session(
        self,
        *,
        readiness: tuple[int, int] = (1, 1),
        history: list[AIMessage] | None = None,
    ) -> MagicMock:
        session = MagicMock()
        conversation_result = MagicMock()
        conversation_result.first.return_value = self.conversation
        document_result = MagicMock()
        document_result.first.return_value = self.document
        readiness_result = MagicMock()
        readiness_result.one.return_value = readiness
        history_result = MagicMock()
        history_result.all.return_value = history or []
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
        document_result = MagicMock()
        document_result.first.return_value = self.document
        session.exec.side_effect = [conversation_result, document_result]
        return session

    def _write_session(
        self,
        *,
        stale: bool = False,
        maximum_sequence: int = 0,
        active_index_generation: int = 1,
    ) -> MagicMock:
        session = MagicMock()
        locked_conversation = self.conversation.model_copy(deep=True)
        if stale:
            locked_conversation.updated_at = datetime.utcnow()
        conversation_result = MagicMock()
        conversation_result.first.return_value = locked_conversation
        document_result = MagicMock()
        document = self.document.model_copy(deep=True)
        document.active_index_generation = active_index_generation
        document_result.first.return_value = document
        maximum_result = MagicMock()
        maximum_result.one.return_value = maximum_sequence
        session.exec.side_effect = [document_result, conversation_result, maximum_result]
        return session

    def test_success_persists_complete_turn_and_real_chunk_citation_once(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        write_session = self._write_session()
        generated = ConversationAnswer(
            claims=[RawGroundedClaim(claim_text="Routing connects a URL to application logic.", cited_evidence_ids=["e_01"])],
                evidence_sufficient=True,
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
        self.assertEqual(answer.citations[0].page_number, 7)
        self.assertIsNone(answer.citations[0].url)
        write_session.commit.assert_called_once_with()
        write_session.rollback.assert_not_called()
        added = [call.args[0] for call in write_session.add.call_args_list]
        self.assertEqual(sum(isinstance(item, AIMessage) for item in added), 2)
        user_message = next(item for item in added if isinstance(item, AIMessage) and item.role == "user")
        self.assertEqual(user_message.selected_text, "Laravel routing")
        locked_document_statement = write_session.exec.call_args_list[0].args[0]
        self.assertIn(
            "FOR UPDATE",
            str(locked_document_statement.compile(dialect=postgresql.dialect())),
        )
        self.assertTrue(
            locked_document_statement.get_execution_options().get("populate_existing")
        )
        locked_conversation_statement = write_session.exec.call_args_list[1].args[0]
        self.assertIn(
            "FOR UPDATE",
            str(locked_conversation_statement.compile(dialect=postgresql.dialect())),
        )
        self.assertIn("documents", str(locked_document_statement))
        self.assertIn("ai_conversations", str(locked_conversation_statement))

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

    def test_malformed_generation_exhaustion_writes_no_turn(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        malformed_response = SimpleNamespace(text='{"claims":')
        with (
            patch(
                "services.ai_chat._open_session",
                side_effect=[
                    _context_manager(read_session),
                    _context_manager(retrieval_session),
                ],
            ) as open_session,
            patch("services.ai_chat.generate_query_embedding", return_value=[0.0] * 768),
            patch("services.ai_chat.search_owned_similar_chunks", return_value=[self.chunk]),
            patch(
                "services.ai_service._generate_structured",
                side_effect=[malformed_response, malformed_response],
            ) as generation,
        ):
            with self.assertRaises(AIServiceError):
                send_conversation_message(
                    conversation_id=self.conversation_id,
                    clerk_user_id="user_owner",
                    question="What is routing?",
                )

        self.assertEqual(generation.call_count, 2)
        self.assertEqual(open_session.call_count, 2)
        read_session.add.assert_not_called()
        retrieval_session.add.assert_not_called()
        read_session.commit.assert_not_called()
        retrieval_session.commit.assert_not_called()

    def test_second_turn_uses_chronological_history_and_persists_sequences_three_and_four(self) -> None:
        stored_messages = [
            AIMessage(
                conversation_id=self.conversation_id,
                sequence_number=2,
                role="assistant",
                content="Routing maps requests to application handlers.",
            ),
            AIMessage(
                conversation_id=self.conversation_id,
                sequence_number=1,
                role="user",
                content="What is routing?",
            ),
        ]
        read_session = self._read_session(history=stored_messages)
        retrieval_session = self._retrieval_session()
        write_session = self._write_session(maximum_sequence=2)
        generated = ConversationAnswer(
            claims=[RawGroundedClaim(claim_text="The document does not cover that follow-up.", cited_evidence_ids=[])],
                evidence_sufficient=False,
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
            patch(
                "services.ai_chat.answer_conversation_question",
                return_value=generated,
            ) as generation,
        ):
            answer = send_conversation_message(
                conversation_id=self.conversation_id,
                clerk_user_id="user_owner",
                question="Does it mention middleware?",
            )

        self.assertEqual(
            generation.call_args.kwargs["conversation_history"],
            [
                ("user", "What is routing?"),
                ("assistant", "Routing maps requests to application handlers."),
            ],
        )
        self.assertEqual(answer.citations, [])
        added = [call.args[0] for call in write_session.add.call_args_list]
        persisted_messages = [item for item in added if isinstance(item, AIMessage)]
        self.assertEqual([item.sequence_number for item in persisted_messages], [3, 4])
        self.assertFalse(any(isinstance(item, AIMessageCitation) for item in added))
        write_session.commit.assert_called_once_with()

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
            claims=[RawGroundedClaim(claim_text="Routing connects URLs to application logic.", cited_evidence_ids=["e_01"])],
                evidence_sufficient=True,
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

    def test_index_activation_during_generation_rejects_turn_before_writes(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        write_session = self._write_session(active_index_generation=2)
        generated = ConversationAnswer(
            claims=[RawGroundedClaim(claim_text="Routing connects URLs to application logic.", cited_evidence_ids=["e_01"])],
                evidence_sufficient=True,
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
            claims=[RawGroundedClaim(claim_text="A variable model response.", cited_evidence_ids=[])],
                evidence_sufficient=False,
            suggested_followups=["A model-provided follow-up"],
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
            patch("services.ai_chat.logger.warning") as warning,
        ):
            answer = send_conversation_message(
                conversation_id=self.conversation_id,
                clerk_user_id="user_owner",
                question="What is the capital of Mars?",
            )

        self.assertEqual(answer.answer_markdown, INSUFFICIENT_EVIDENCE_ANSWER)
        self.assertEqual(answer.citations, [])
        self.assertEqual(answer.suggested_followups, [])
        write_session.commit.assert_called_once_with()
        added = [call.args[0] for call in write_session.add.call_args_list]
        self.assertEqual(sum(isinstance(item, AIMessage) for item in added), 2)
        self.assertFalse(any(isinstance(item, AIMessageCitation) for item in added))
        assistant_message = next(
            item for item in added if isinstance(item, AIMessage) and item.role == "assistant"
        )
        self.assertEqual(assistant_message.content, INSUFFICIENT_EVIDENCE_ANSWER)
        self.assertEqual(assistant_message.suggested_followups, [])
        warning.assert_not_called()

    def test_insufficient_evidence_with_structured_citation_discards_model_output(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        write_session = self._write_session()
        generated = ConversationAnswer(
            claims=[RawGroundedClaim(claim_text="An unsupported answer.", cited_evidence_ids=["e_01"])],
                evidence_sufficient=False,
            suggested_followups=["Keep exploring"],
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
            patch("services.ai_chat.logger.warning") as warning,
        ):
            answer = send_conversation_message(
                conversation_id=self.conversation_id,
                clerk_user_id="user_owner",
                question="What is the capital of Mars?",
            )

        self.assertEqual(answer.answer_markdown, INSUFFICIENT_EVIDENCE_ANSWER)
        self.assertEqual(answer.citations, [])
        self.assertEqual(answer.suggested_followups, [])
        warning.assert_called_once()
        write_session.commit.assert_called_once_with()
        added = [call.args[0] for call in write_session.add.call_args_list]
        self.assertEqual(sum(isinstance(item, AIMessage) for item in added), 2)
        self.assertFalse(any(isinstance(item, AIMessageCitation) for item in added))

    def test_insufficient_evidence_with_marker_only_persists_fallback(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        write_session = self._write_session()
        generated = ConversationAnswer(
            claims=[RawGroundedClaim(claim_text="I cannot answer this.", cited_evidence_ids=[])],
                evidence_sufficient=False,
            suggested_followups=["Keep exploring"],
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
            patch("services.ai_chat.logger.warning") as warning,
        ):
            answer = send_conversation_message(
                conversation_id=self.conversation_id,
                clerk_user_id="user_owner",
                question="What is the capital of Mars?",
            )

        self.assertEqual(answer.answer_markdown, INSUFFICIENT_EVIDENCE_ANSWER)
        self.assertEqual(answer.citations, [])
        self.assertEqual(answer.suggested_followups, [])
        warning.assert_not_called()
        write_session.commit.assert_called_once_with()
        added = [call.args[0] for call in write_session.add.call_args_list]
        self.assertEqual(sum(isinstance(item, AIMessage) for item in added), 2)
        self.assertFalse(any(isinstance(item, AIMessageCitation) for item in added))

    def test_blank_answer_after_marker_sanitization_is_not_persisted(self) -> None:
        read_session = self._read_session()
        retrieval_session = self._retrieval_session()
        generated = ConversationAnswer(
            claims=[],
            evidence_sufficient=True,
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
            claims=[RawGroundedClaim(claim_text="Routing maps URLs.", cited_evidence_ids=["e_09"])],
                evidence_sufficient=True,
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


class AIChatRealSessionRegressionTests(unittest.TestCase):
    def test_success_returns_committed_assistant_id_with_one_turn_and_citation(self) -> None:
        test_engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        SQLModel.metadata.create_all(
            test_engine,
            tables=[
                Document.__table__,
                DocumentChunk.__table__,
                AIConversation.__table__,
                AIMessage.__table__,
                AIMessageCitation.__table__,
            ],
        )

        document_id = uuid.uuid4()
        conversation_id = uuid.uuid4()
        chunk_id = uuid.uuid4()
        with Session(test_engine) as session:
            session.add(
                Document(
                    id=document_id,
                    clerk_user_id="user_owner",
                    filename="routing.pdf",
                    file_url="uploads/routing.pdf",
                    status=DocumentStatus.COMPLETED,
                )
            )
            session.add(
                AIConversation(
                    id=conversation_id,
                    clerk_user_id="user_owner",
                    document_id=document_id,
                    title="Routing",
                )
            )
            session.add(
                DocumentChunk(
                    id=chunk_id,
                    document_id=document_id,
                    order_index=0,
                    content="Laravel routes map URLs to controller actions.",
                )
            )
            session.commit()

        generated = ConversationAnswer(
            claims=[RawGroundedClaim(claim_text="Routing connects a URL to application logic.", cited_evidence_ids=["e_01"])],
                evidence_sufficient=True,
            suggested_followups=["How do route parameters work?"],
        )

        def retrieve_seeded_chunks(*, session: Session, **_: object) -> list[DocumentChunk]:
            return list(
                session.exec(
                    select(DocumentChunk).where(DocumentChunk.id == chunk_id)
                ).all()
            )

        try:
            with (
                patch("services.ai_chat.engine", test_engine),
                patch(
                    "services.ai_chat.get_document_index_readiness",
                    return_value=SimpleNamespace(is_ready=True, is_repairable=False),
                ),
                patch(
                    "services.ai_chat.generate_query_embedding",
                    return_value=[0.0] * 768,
                ),
                patch(
                    "services.ai_chat.search_owned_similar_chunks",
                    side_effect=retrieve_seeded_chunks,
                ),
                patch(
                    "services.ai_chat.answer_conversation_question",
                    return_value=generated,
                ),
            ):
                answer = send_conversation_message(
                    conversation_id=conversation_id,
                    clerk_user_id="user_owner",
                    question="What is routing?",
                )

            with Session(test_engine) as session:
                messages = session.exec(
                    select(AIMessage)
                    .where(AIMessage.conversation_id == conversation_id)
                    .order_by(AIMessage.sequence_number.asc())
                ).all()
                citations = session.exec(select(AIMessageCitation)).all()

                self.assertEqual(len(messages), 2)
                self.assertEqual([message.role for message in messages], ["user", "assistant"])
                self.assertEqual(len(citations), 1)
                self.assertEqual(answer.message_id, messages[1].id)
                self.assertEqual(citations[0].message_id, messages[1].id)
                self.assertEqual(citations[0].chunk_id, chunk_id)
                self.assertEqual(answer.citations[0].chunk_id, chunk_id)
        finally:
            test_engine.dispose()


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

    def test_web_mode_is_rejected_before_service_call(self) -> None:
        payload = SendMessageRequest(
            question="Search the web",
            retrieval_mode="web",
        )
        with patch("api.routes.ai_chat.send_conversation_message") as send:
            with self.assertRaises(HTTPException) as raised:
                send_ai_conversation_message(
                    self.conversation_id,
                    payload,
                    self.current_user,
                )

        send.assert_not_called()
        self.assertEqual(raised.exception.status_code, 409)
        self.assertEqual(
            raised.exception.detail,
            "Web and hybrid retrieval are not available yet.",
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

    def test_ai_service_error_logs_safe_metadata_and_returns_stable_bad_gateway(self) -> None:
        validation_error: ValidationError
        try:
            ConversationAnswer.model_validate_json('{"claims":')
        except ValidationError as exc:
            validation_error = exc
        error = AIServiceError(
            "Gemini returned an invalid structured conversation answer after retry."
        )
        error.__cause__ = validation_error

        with (
            patch("api.routes.ai_chat.send_conversation_message", side_effect=error),
            patch("api.routes.ai_chat.logger.warning") as warning,
        ):
            with self.assertRaises(HTTPException) as raised:
                send_ai_conversation_message(
                    self.conversation_id,
                    self.payload,
                    self.current_user,
                )

        self.assertEqual(raised.exception.status_code, 502)
        self.assertEqual(
            raised.exception.detail,
            "AI could not generate a response right now. Please try again.",
        )
        warning.assert_called_once_with(
            "Conversation AI request failed: conversation_id=%s error_type=%s cause_type=%s",
            self.conversation_id,
            "AIServiceError",
            "ValidationError",
        )

if __name__ == "__main__":
    unittest.main()

class RenderGroundedAnswerTests(unittest.TestCase):
    def test_deterministic_markdown_output_ordering_and_spacing(self):
        from services.ai_chat import _render_grounded_answer
        from schemas.domain import DomainGroundedClaim

        claims = [
            DomainGroundedClaim(claim_text="Multiple sources out of order.", cited_evidence_ids=["e_03", "e_01"]),
            DomainGroundedClaim(claim_text="Single source with trailing space. ", cited_evidence_ids=["e_02"]),
            DomainGroundedClaim(claim_text="No sources.", cited_evidence_ids=[]),
            DomainGroundedClaim(claim_text="Malformed evidence ID.", cited_evidence_ids=["e_abc"]),
            DomainGroundedClaim(claim_text="Duplicate evidence ID.", cited_evidence_ids=["e_01", "e_01"]),
        ]
        
        markdown, cited_eids = _render_grounded_answer(claims)
        
        expected_paragraphs = [
            "Multiple sources out of order. [1][3]",
            "Single source with trailing space. [2]",
            "No sources.",
            "Malformed evidence ID.",
            "Duplicate evidence ID. [1]"
        ]
        self.assertEqual(markdown, "\n\n".join(expected_paragraphs))
        self.assertEqual(cited_eids, {"e_01", "e_02", "e_03", "e_abc"})
