from __future__ import annotations

import unittest
import uuid
from unittest.mock import patch

from sqlalchemy.dialects import postgresql
from sqlmodel import select

from models.tables import Document, DocumentChunk, DocumentStatus, Vector
from services.ai_service import (
    ComprehensiveSummary,
    FlashcardPayload,
    QuizQuestionPayload,
    StudyMaterialQualityError,
    TopicDetail,
    verify_study_materials,
)
from services.documents import build_semantic_chunk_clusters
from tasks.document_processing import _embed_unfinished_chunks


class Phase4RagTests(unittest.TestCase):
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
