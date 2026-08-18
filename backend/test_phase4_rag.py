from __future__ import annotations

import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from sqlalchemy.dialects import postgresql
from sqlmodel import select

from models.tables import Document, DocumentChunk, DocumentStatus, Vector
from services.ai_service import (
    ComprehensiveSummary,
    FlashcardPayload,
    QuizQuestionPayload,
    StudyMaterialQualityError,
    TopicDetail,
    generate_embeddings_batch,
    generate_query_embedding,
    verify_study_materials,
)
from services.documents import (
    DocumentIndexReadiness,
    build_semantic_chunk_clusters,
    claim_unembedded_document_chunks,
    get_document_index_readiness,
)
from tasks.document_processing import (
    _embed_unfinished_chunks,
    _generate_and_persist_materials,
    _repair_completed_document_index,
)


class Phase4RagTests(unittest.TestCase):
    def test_index_readiness_requires_every_stored_chunk_to_be_embedded(self) -> None:
        session = MagicMock()
        generation_result = MagicMock()
        generation_result.one.return_value = 4
        counts_result = MagicMock()
        counts_result.one.return_value = (3, 2)
        session.exec.side_effect = [generation_result, counts_result]

        readiness = get_document_index_readiness(
            session=session,
            document_id=uuid.uuid4(),
        )

        self.assertEqual(readiness.total_chunks, 3)
        self.assertEqual(readiness.embedded_chunks, 2)
        self.assertEqual(readiness.generation, 4)
        self.assertFalse(readiness.is_ready)
        self.assertTrue(readiness.is_repairable)
        self.assertFalse(DocumentIndexReadiness(0, 0).is_ready)
        self.assertFalse(DocumentIndexReadiness(0, 0).is_repairable)
        self.assertTrue(DocumentIndexReadiness(3, 3).is_ready)

    def test_missing_chunk_claim_uses_skip_locked_batch(self) -> None:
        session = MagicMock()
        result = MagicMock()
        result.all.return_value = []
        session.exec.return_value = result

        claim_unembedded_document_chunks(
            session=session,
            document_id=uuid.uuid4(),
            limit=24,
        )

        statement = session.exec.call_args.args[0]
        compiled = str(statement.compile(dialect=postgresql.dialect()))
        self.assertIn("FOR UPDATE SKIP LOCKED", compiled)
        self.assertIn("document_chunks.embedding IS NULL", compiled)

    def test_retry_repairs_partial_flashcard_and_quiz_sets(self) -> None:
        document = Document(
            id=uuid.uuid4(),
            filename="notes.pdf",
            file_url="uploads/notes.pdf",
        )
        summary = ComprehensiveSummary(
            overall_overview="Overview",
            detailed_sections=[
                TopicDetail(
                    topic_title="Topic",
                    key_points=["one", "two", "three", "four"],
                    important_terms_and_definitions=[],
                )
            ],
        )
        partial_cards = [
            DocumentChunk(document_id=document.id, order_index=0, content="unused")
        ]
        generated_cards = [
            FlashcardPayload(front=f"Card {index}", back="Answer")
            for index in range(15)
        ]
        partial_questions = [
            QuizQuestionPayload(
                question="Partial",
                options=["A", "B", "C", "D"],
                correct_answer_index=0,
                explanation="Explanation",
            )
        ]
        generated_questions = [
            QuizQuestionPayload(
                question=f"Question {index}",
                options=["A", "B", "C", "D"],
                correct_answer_index=0,
                explanation="Explanation",
            )
            for index in range(10)
        ]

        with (
            patch("tasks.document_processing._load_summary", return_value=(MagicMock(), summary)),
            patch("tasks.document_processing._load_flashcards", return_value=partial_cards),
            patch("tasks.document_processing._to_flashcard_payloads", return_value=[generated_cards[0]]),
            patch("tasks.document_processing._load_quiz_questions", return_value=partial_questions),
            patch("tasks.document_processing.clear_incomplete_flashcards") as clear_cards,
            patch("tasks.document_processing.clear_incomplete_quiz") as clear_quiz,
            patch("tasks.document_processing.generate_flashcards_from_summary", return_value=generated_cards),
            patch("tasks.document_processing.generate_quiz_from_summary", return_value=generated_questions),
            patch("tasks.document_processing.save_flashcards"),
            patch("tasks.document_processing.save_quiz"),
            patch("tasks.document_processing.update_document_status"),
        ):
            _, cards, questions = _generate_and_persist_materials(
                session=MagicMock(),
                document=document,
                chunks=[],
            )

        clear_cards.assert_called_once()
        clear_quiz.assert_called_once()
        self.assertEqual(len(cards), 15)
        self.assertEqual(len(questions), 10)

    def test_embedding_requests_current_model_with_768_dimensions(self) -> None:
        client = MagicMock()
        client.models.embed_content.side_effect = [
            SimpleNamespace(embeddings=[SimpleNamespace(values=[0.0] * 768)]),
            SimpleNamespace(embeddings=[SimpleNamespace(values=[0.0] * 768)]),
        ]

        with (
            patch("services.llm_provider._get_api_key", return_value="test-key"),
            patch("services.llm_provider._get_client", return_value=client),
        ):
            generate_embeddings_batch(["document chunk"])
            generate_query_embedding("search query")

        document_call, query_call = client.models.embed_content.call_args_list
        self.assertEqual(document_call.kwargs["model"], "gemini-embedding-2")
        self.assertEqual(query_call.kwargs["model"], "gemini-embedding-2")
        self.assertEqual(document_call.kwargs["config"].output_dimensionality, 768)
        self.assertEqual(query_call.kwargs["config"].output_dimensionality, 768)
        self.assertEqual(document_call.kwargs["config"].task_type, "RETRIEVAL_DOCUMENT")
        self.assertEqual(query_call.kwargs["config"].task_type, "RETRIEVAL_QUERY")

    def test_vector_binding_and_cosine_query_compile_for_postgresql(self) -> None:
        vector = Vector(768)
        bound_vector = vector.bind_processor(None)([0.0] * 768)
        self.assertTrue(bound_vector and bound_vector.startswith("[0,"))

        statement = (
            select(DocumentChunk)
            .where(DocumentChunk.embedding.is_not(None))
            .order_by(DocumentChunk.embedding.cosine_distance([0.0] * 768))
            .limit(5)
        )
        compiled = str(statement.compile(dialect=postgresql.dialect()))
        self.assertIn("<=>", compiled)

    def test_semantic_clusters_preserve_each_chunk_once(self) -> None:
        document_id = uuid.uuid4()
        chunks = [
            DocumentChunk(document_id=document_id, order_index=0, content="algebra", embedding=[1.0, 0.0]),
            DocumentChunk(document_id=document_id, order_index=1, content="equations", embedding=[0.9, 0.1]),
            DocumentChunk(document_id=document_id, order_index=2, content="biology", embedding=[0.0, 1.0]),
            DocumentChunk(document_id=document_id, order_index=3, content="cells", embedding=[0.1, 0.9]),
        ]

        clusters = build_semantic_chunk_clusters(chunks, max_chunks_per_cluster=2)

        self.assertEqual(
            sorted(content for cluster in clusters for content in cluster),
            ["algebra", "biology", "cells", "equations"],
        )
        self.assertTrue(all(len(cluster) <= 2 for cluster in clusters))

    def test_embedding_stage_only_persists_unfinished_chunks(self) -> None:
        document = Document(id=uuid.uuid4(), filename="notes.pdf", file_url="uploads/notes.pdf")
        unfinished = [
            DocumentChunk(document_id=document.id, order_index=4, content="unfinished chunk"),
        ]
        completed = DocumentChunk(
            document_id=document.id,
            order_index=0,
            content="completed chunk",
            embedding=[0.0] * 768,
        )

        with (
            patch("tasks.document_processing.update_document_status") as update_status,
            patch("tasks.document_processing.get_unembedded_document_chunks", return_value=unfinished),
            patch("tasks.document_processing.generate_embeddings_batch", return_value=[[1.0] * 768]) as embed,
            patch("tasks.document_processing.save_chunk_embeddings") as save_embeddings,
            patch("tasks.document_processing.get_document_chunks", return_value=[completed, *unfinished]),
        ):
            result = _embed_unfinished_chunks(session=object(), document=document)

        self.assertEqual(result, [completed, *unfinished])
        update_status.assert_called_once()
        embed.assert_called_once_with(["unfinished chunk"])
        save_embeddings.assert_called_once()

    def test_completed_index_repair_embeds_only_missing_chunks_and_preserves_status(self) -> None:
        document = Document(
            id=uuid.uuid4(),
            filename="notes.pdf",
            file_url="uploads/notes.pdf",
            status=DocumentStatus.COMPLETED,
        )
        missing = DocumentChunk(
            document_id=document.id,
            order_index=1,
            content="missing embedding",
        )
        session = MagicMock()
        context = MagicMock()
        context.__enter__.return_value = session
        context.__exit__.return_value = False

        with (
            patch("tasks.document_processing.Session", return_value=context),
            patch("tasks.document_processing._get_document", return_value=document),
            patch(
                "tasks.document_processing.claim_unembedded_document_chunks",
                side_effect=[[missing], []],
            ),
            patch(
                "tasks.document_processing.generate_embeddings_batch",
                return_value=[[1.0] * 768],
            ) as generate,
            patch("tasks.document_processing.save_chunk_embeddings") as save,
            patch(
                "tasks.document_processing.get_document_index_readiness",
                return_value=DocumentIndexReadiness(2, 2),
            ),
            patch("tasks.document_processing.update_document_status") as update_status,
        ):
            result = _repair_completed_document_index(str(document.id))

        generate.assert_called_once_with(["missing embedding"])
        save.assert_called_once_with(
            session=session,
            chunks=[missing],
            embeddings=[[1.0] * 768],
        )
        update_status.assert_not_called()
        self.assertEqual(document.status, DocumentStatus.COMPLETED)
        self.assertEqual(result["embedded_during_repair"], 1)

    def test_completed_index_repair_is_an_idempotent_noop_when_fully_embedded(self) -> None:
        document = Document(
            id=uuid.uuid4(),
            filename="notes.pdf",
            file_url="uploads/notes.pdf",
            status=DocumentStatus.COMPLETED,
        )
        session = MagicMock()
        context = MagicMock()
        context.__enter__.return_value = session
        context.__exit__.return_value = False

        with (
            patch("tasks.document_processing.Session", return_value=context),
            patch("tasks.document_processing._get_document", return_value=document),
            patch("tasks.document_processing.claim_unembedded_document_chunks", return_value=[]),
            patch("tasks.document_processing.generate_embeddings_batch") as generate,
            patch("tasks.document_processing.save_chunk_embeddings") as save,
            patch(
                "tasks.document_processing.get_document_index_readiness",
                return_value=DocumentIndexReadiness(2, 2),
            ),
        ):
            result = _repair_completed_document_index(str(document.id))

        generate.assert_not_called()
        save.assert_not_called()
        self.assertEqual(result["status"], DocumentStatus.COMPLETED.value)
        self.assertEqual(result["embedded_during_repair"], 0)

    def test_completed_index_repair_failure_does_not_change_document_status(self) -> None:
        document = Document(
            id=uuid.uuid4(),
            filename="notes.pdf",
            file_url="uploads/notes.pdf",
            status=DocumentStatus.COMPLETED,
        )
        missing = DocumentChunk(
            document_id=document.id,
            order_index=1,
            content="missing embedding",
        )
        session = MagicMock()
        context = MagicMock()
        context.__enter__.return_value = session
        context.__exit__.return_value = False

        with (
            patch("tasks.document_processing.Session", return_value=context),
            patch("tasks.document_processing._get_document", return_value=document),
            patch(
                "tasks.document_processing.claim_unembedded_document_chunks",
                return_value=[missing],
            ),
            patch(
                "tasks.document_processing.generate_embeddings_batch",
                side_effect=RuntimeError("embedding unavailable"),
            ),
            patch("tasks.document_processing.save_chunk_embeddings") as save,
            patch("tasks.document_processing.update_document_status") as update_status,
        ):
            with self.assertRaises(RuntimeError):
                _repair_completed_document_index(str(document.id))

        save.assert_not_called()
        update_status.assert_not_called()
        self.assertEqual(document.status, DocumentStatus.COMPLETED)

    def test_quality_gate_rejects_duplicate_flashcards(self) -> None:
        summary = ComprehensiveSummary(
            overall_overview="A valid overview.",
            detailed_sections=[
                TopicDetail(
                    topic_title="Topic",
                    key_points=["one", "two", "three", "four"],
                    important_terms_and_definitions=[],
                )
            ],
        )
        flashcards = [FlashcardPayload(front=f"Card {index}", back="Answer") for index in range(14)]
        flashcards.append(FlashcardPayload(front="Card 0", back="Duplicate"))
        questions = [
            QuizQuestionPayload(
                question=f"Question {index}",
                options=["A", "B", "C", "D"],
                correct_answer_index=0,
                explanation="Explanation",
            )
            for index in range(10)
        ]

        with self.assertRaises(StudyMaterialQualityError):
            verify_study_materials(
                summary=summary,
                flashcards=flashcards,
                questions=questions,
            )


if __name__ == "__main__":
    unittest.main()
