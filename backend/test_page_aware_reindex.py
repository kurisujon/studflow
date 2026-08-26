from __future__ import annotations

import unittest
import uuid
import importlib.util
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.dialects import postgresql

from api.routes.documents import reindex_document
from core.auth import CurrentUser
from core.config import Settings
from models.tables import Document, DocumentChunk, DocumentStatus
from services.document_processing import (
    DocumentChunkPayload,
    ExtractedPage,
    chunk_docx_text,
    chunk_pdf_pages,
    extract_pdf_pages,
    iter_pdf_pages,
)
from services.documents import (
    activate_document_index_generation,
    checkpoint_active_index_page,
    checkpoint_reindex_page,
    claim_reindex_embedding_batch,
    claim_document_reindex,
    release_document_reindex_claim,
    save_reindex_chunk_embeddings,
    search_owned_similar_chunks,
)
from tasks.document_processing import (
    _extract_and_persist_chunks,
    _reindex_completed_pdf,
    process_document_task,
    reindex_document_task,
)


class PageAwareModelTests(unittest.TestCase):
    def test_reindex_lease_must_exceed_hard_task_limit(self) -> None:
        settings = Settings(_env_file=None)
        self.assertGreater(
            settings.document_reindex_lease_seconds,
            settings.celery_task_time_limit,
        )
        with self.assertRaises(ValidationError):
            Settings(
                _env_file=None,
                document_reindex_lease_seconds=600,
                celery_task_time_limit=600,
            )

    def test_generation_and_page_constraints_are_declared(self) -> None:
        document_constraints = {
            constraint.name for constraint in Document.__table__.constraints
        }
        chunk_constraints = {
            constraint.name for constraint in DocumentChunk.__table__.constraints
        }
        chunk_indexes = {index.name for index in DocumentChunk.__table__.indexes}

        self.assertIn(
            "ck_documents_active_index_page_cursor_nonnegative",
            document_constraints,
        )
        self.assertIn(
            "ck_documents_pending_index_generation_newer",
            document_constraints,
        )
        self.assertIn(
            "ck_documents_pending_index_lease_consistent",
            document_constraints,
        )
        self.assertIn(
            "uq_document_chunks_document_generation_order",
            chunk_constraints,
        )
        self.assertIn("ck_document_chunks_positive_page", chunk_constraints)
        self.assertIn("ix_document_chunks_document_generation", chunk_indexes)
        document = Document(filename="x.pdf", file_url="x")
        self.assertEqual(document.active_index_generation, 1)
        self.assertEqual(document.active_index_page_cursor, 0)
        self.assertEqual(
            DocumentChunk(document_id=uuid.uuid4(), content="x").index_generation,
            1,
        )


class PageAwareExtractionTests(unittest.TestCase):
    def test_native_text_pages_skip_ocr(self) -> None:
        page = MagicMock()
        page.get_text.return_value = "Enough native text for this page"
        pdf = MagicMock(page_count=1)
        pdf.__getitem__.return_value = page
        manager = MagicMock()
        manager.__enter__.return_value = pdf
        manager.__exit__.return_value = False

        with (
            patch("services.document_processing.fitz.open", return_value=manager),
            patch("services.document_processing._ocr_pdf_page") as ocr,
        ):
            pages, count = extract_pdf_pages(
                b"pdf",
                ocr_enabled=True,
                ocr_min_text_chars=10,
            )

        ocr.assert_not_called()
        self.assertEqual(count, 1)
        self.assertEqual(pages, [ExtractedPage(1, "Enough native text for this page")])

    def test_text_sparse_page_uses_ocr(self) -> None:
        page = MagicMock()
        page.get_text.return_value = ""
        pdf = MagicMock(page_count=1)
        pdf.__getitem__.return_value = page
        manager = MagicMock()
        manager.__enter__.return_value = pdf
        manager.__exit__.return_value = False

        with (
            patch("services.document_processing.fitz.open", return_value=manager),
            patch(
                "services.document_processing._ocr_pdf_page",
                return_value="OCR page text",
            ) as ocr,
        ):
            pages, _ = extract_pdf_pages(
                b"pdf",
                ocr_enabled=True,
                ocr_language="eng",
                ocr_dpi=300,
                ocr_min_text_chars=40,
            )

        ocr.assert_called_once_with(page, language="eng", dpi=300)
        self.assertEqual(pages[0].text, "OCR page text")

    def test_shorter_ocr_output_does_not_replace_native_text(self) -> None:
        page = MagicMock()
        page.get_text.return_value = "usable native text"
        pdf = MagicMock(page_count=1)
        pdf.__getitem__.return_value = page
        manager = MagicMock()
        manager.__enter__.return_value = pdf
        manager.__exit__.return_value = False

        with (
            patch("services.document_processing.fitz.open", return_value=manager),
            patch("services.document_processing._ocr_pdf_page", return_value="short"),
        ):
            pages = list(
                iter_pdf_pages(
                    b"pdf",
                    ocr_enabled=True,
                    ocr_min_text_chars=40,
                )
            )

        self.assertEqual(pages[0].text, "usable native text")

    def test_pdf_chunks_never_cross_page_boundaries(self) -> None:
        chunks = chunk_pdf_pages(
            [ExtractedPage(1, "one two three"), ExtractedPage(2, "four five six")],
            chunk_size=2,
            overlap=0,
        )

        self.assertEqual(
            chunks,
            [
                DocumentChunkPayload("one two", 1),
                DocumentChunkPayload("three", 1),
                DocumentChunkPayload("four five", 2),
                DocumentChunkPayload("six", 2),
            ],
        )

    def test_docx_chunks_have_no_page_number(self) -> None:
        chunks = chunk_docx_text("one two three", chunk_size=2, overlap=0)
        self.assertTrue(chunks)
        self.assertTrue(all(chunk.page_number is None for chunk in chunks))


class GenerationIsolationTests(unittest.TestCase):
    def test_owned_search_filters_an_explicit_generation(self) -> None:
        session = MagicMock()
        result = MagicMock()
        result.all.return_value = []
        session.exec.return_value = result

        search_owned_similar_chunks(
            session=session,
            document_id=uuid.uuid4(),
            clerk_user_id="owner",
            query_embedding=[0.0] * 768,
            index_generation=3,
        )

        statement = session.exec.call_args.args[0]
        compiled = str(statement.compile(dialect=postgresql.dialect()))
        self.assertIn("document_chunks.index_generation", compiled)
        self.assertIn("documents.clerk_user_id", compiled)


class ReindexGenerationTests(unittest.TestCase):
    def test_claim_reserves_exactly_the_next_generation(self) -> None:
        claimed_at = datetime(2026, 8, 15, 12, 0, 0)
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            active_index_generation=2,
        )
        session = MagicMock()
        result = MagicMock()
        result.first.return_value = document
        session.exec.return_value = result

        active, pending, lease_token = claim_document_reindex(
            session=session,
            document_id=document.id,
            lease_seconds=900,
            now=claimed_at,
        )

        self.assertEqual((active, pending), (2, 3))
        self.assertEqual(document.pending_index_generation, 3)
        self.assertEqual(document.pending_index_page_cursor, 0)
        self.assertEqual(document.pending_index_heartbeat_at, claimed_at)
        self.assertEqual(document.pending_index_lease_token, lease_token)
        statement = session.exec.call_args_list[0].args[0]
        self.assertTrue(statement.get_execution_options().get("populate_existing"))
        session.commit.assert_called_once_with()

    def test_page_aware_active_generation_cannot_be_claimed_from_stale_route_state(self) -> None:
        stale_route_document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
        )
        locked_page_aware_document = stale_route_document.model_copy(deep=True)
        locked_page_aware_document.active_index_page_cursor = 3
        session = MagicMock()
        document_result = MagicMock()
        document_result.first.return_value = locked_page_aware_document
        page_aware_result = MagicMock()
        page_aware_result.first.return_value = None
        session.exec.side_effect = [document_result, page_aware_result]

        with self.assertRaisesRegex(ValueError, "already page-aware"):
            claim_document_reindex(
                session=session,
                document_id=stale_route_document.id,
                lease_seconds=900,
            )

        self.assertIsNone(locked_page_aware_document.pending_index_generation)
        session.add.assert_not_called()
        session.commit.assert_not_called()
        session.rollback.assert_called_once_with()

    def test_duplicate_claim_is_rejected(self) -> None:
        now = datetime(2026, 8, 15, 12, 0, 0)
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            active_index_generation=1,
            pending_index_generation=2,
            pending_index_started_at=now - timedelta(seconds=20),
            pending_index_heartbeat_at=now - timedelta(seconds=5),
            pending_index_page_cursor=3,
            pending_index_lease_token=uuid.uuid4(),
        )
        session = MagicMock()
        result = MagicMock()
        result.first.return_value = document
        session.exec.return_value = result

        with self.assertRaisesRegex(ValueError, "already in progress"):
            claim_document_reindex(
                session=session,
                document_id=document.id,
                lease_seconds=900,
                now=now,
            )

        session.commit.assert_not_called()
        session.rollback.assert_called_once_with()

    def test_stale_claim_resumes_same_generation_and_cursor(self) -> None:
        now = datetime(2026, 8, 15, 12, 0, 0)
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            active_index_generation=1,
            pending_index_generation=2,
            pending_index_started_at=now - timedelta(seconds=1200),
            pending_index_heartbeat_at=now - timedelta(seconds=1000),
            pending_index_page_cursor=7,
            pending_index_lease_token=uuid.uuid4(),
        )
        session = MagicMock()
        result = MagicMock()
        result.first.return_value = document
        session.exec.return_value = result

        active, pending, lease_token = claim_document_reindex(
            session=session,
            document_id=document.id,
            lease_seconds=900,
            now=now,
        )

        self.assertEqual((active, pending), (1, 2))
        self.assertEqual(document.pending_index_page_cursor, 7)
        self.assertEqual(document.pending_index_heartbeat_at, now)
        self.assertEqual(document.pending_index_lease_token, lease_token)

    def test_release_clears_matching_lease_and_staged_chunks(self) -> None:
        now = datetime(2026, 8, 15, 12, 0, 0)
        lease_token = uuid.uuid4()
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            pending_index_generation=2,
            pending_index_started_at=now,
            pending_index_heartbeat_at=now,
            pending_index_page_cursor=2,
            pending_index_lease_token=lease_token,
        )
        session = MagicMock()
        result = MagicMock()
        result.first.return_value = document
        session.exec.side_effect = [result, MagicMock()]

        release_document_reindex_claim(
            session=session,
            document_id=document.id,
            index_generation=2,
            lease_token=lease_token,
            clean_staged=True,
        )

        delete_statement = session.exec.call_args_list[1].args[0]
        self.assertIn(
            "DELETE FROM document_chunks",
            str(delete_statement.compile(dialect=postgresql.dialect())),
        )
        self.assertIsNone(document.pending_index_generation)
        self.assertIsNone(document.pending_index_started_at)
        self.assertIsNone(document.pending_index_heartbeat_at)
        self.assertIsNone(document.pending_index_lease_token)
        self.assertIsNone(document.pending_index_page_cursor)

    def test_superseded_worker_token_cannot_release_new_lease(self) -> None:
        current_token = uuid.uuid4()
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            pending_index_generation=2,
            pending_index_started_at=datetime.now(timezone.utc),
            pending_index_heartbeat_at=datetime.now(timezone.utc),
            pending_index_page_cursor=3,
            pending_index_lease_token=current_token,
        )
        session = MagicMock()
        result = MagicMock()
        result.first.return_value = document
        session.exec.return_value = result

        release_document_reindex_claim(
            session=session,
            document_id=document.id,
            index_generation=2,
            lease_token=uuid.uuid4(),
            clean_staged=True,
        )

        self.assertEqual(document.pending_index_generation, 2)
        self.assertEqual(document.pending_index_lease_token, current_token)
        self.assertEqual(session.exec.call_count, 1)


class ReindexRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.document = Document(
            id=uuid.uuid4(),
            clerk_user_id="owner",
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
        )
        self.user = CurrentUser(clerk_user_id="owner")
        self.session = MagicMock()
        legacy_result = MagicMock()
        legacy_result.first.return_value = DocumentChunk(
            document_id=self.document.id,
            content="legacy",
            page_number=None,
        )
        self.session.exec.return_value = legacy_result
        self.manager = MagicMock()
        self.manager.__enter__.return_value = self.session
        self.manager.__exit__.return_value = False

    def test_owner_can_queue_one_legacy_pdf_generation(self) -> None:
        task_id = uuid.uuid4()
        lease_token = uuid.uuid4()
        with (
            patch("api.routes.documents.Session", return_value=self.manager),
            patch("api.routes.documents._get_owned_document", return_value=self.document),
            patch("api.routes.documents.settings.document_reindex_enabled", True),
            patch(
                "api.routes.documents.claim_document_reindex",
                return_value=(1, 2, lease_token),
            ) as claim,
            patch(
                "api.routes.documents.reindex_document_task.delay",
                return_value=SimpleNamespace(id=task_id),
            ) as delay,
        ):
            response = reindex_document(self.document.id, self.user, session=self.session)

        claim.assert_called_once_with(
            session=self.session,
            document_id=self.document.id,
            lease_seconds=900,
        )
        delay.assert_called_once_with(str(self.document.id), 2, str(lease_token))
        self.assertEqual(response.task_id, str(task_id))
        self.assertEqual(response.pending_index_generation, 2)

    def test_queue_failure_releases_matching_pending_claim(self) -> None:
        lease_token = uuid.uuid4()
        with (
            patch("api.routes.documents.Session", return_value=self.manager),
            patch("api.routes.documents._get_owned_document", return_value=self.document),
            patch("api.routes.documents.settings.document_reindex_enabled", True),
            patch(
                "api.routes.documents.claim_document_reindex",
                return_value=(1, 2, lease_token),
            ),
            patch(
                "api.routes.documents.reindex_document_task.delay",
                side_effect=RuntimeError("redis unavailable"),
            ),
            patch("api.routes.documents.release_document_reindex_claim") as release,
        ):
            with self.assertRaises(HTTPException) as raised:
                reindex_document(self.document.id, self.user, session=self.session)

        release.assert_called_once_with(
            session=self.session,
            document_id=self.document.id,
            index_generation=2,
            lease_token=lease_token,
            clean_staged=True,
        )
        self.assertEqual(raised.exception.status_code, 503)

    def test_non_owner_is_rejected_before_feature_state_is_revealed(self) -> None:
        not_found = HTTPException(status_code=404, detail="Document not found.")
        with (
            patch("api.routes.documents.Session", return_value=self.manager),
            patch("api.routes.documents._get_owned_document", side_effect=not_found),
            patch("api.routes.documents.claim_document_reindex") as claim,
        ):
            with self.assertRaises(HTTPException) as raised:
                reindex_document(self.document.id, CurrentUser(clerk_user_id="other"), session=self.session)

        claim.assert_not_called()
        self.assertEqual(raised.exception.status_code, 404)

    def test_stale_route_document_cannot_claim_page_aware_active_generation(self) -> None:
        locked_document = self.document.model_copy(deep=True)
        locked_document.active_index_page_cursor = 3
        locked_result = MagicMock()
        locked_result.first.return_value = locked_document
        page_aware_result = MagicMock()
        page_aware_result.first.return_value = None
        self.session.exec.side_effect = [locked_result, page_aware_result]

        with (
            patch("api.routes.documents.Session", return_value=self.manager),
            patch(
                "api.routes.documents._get_owned_document",
                return_value=self.document,
            ),
            patch("api.routes.documents.settings.document_reindex_enabled", True),
            patch("api.routes.documents.reindex_document_task.delay") as delay,
        ):
            with self.assertRaises(HTTPException) as raised:
                reindex_document(self.document.id, self.user, session=self.session)

        self.assertEqual(raised.exception.status_code, 409)
        self.assertEqual(raised.exception.detail, "The active PDF index is already page-aware.")
        self.assertIsNone(locked_document.pending_index_generation)
        delay.assert_not_called()

    def test_activation_swaps_generation_only_after_complete_counts(self) -> None:
        lease_token = uuid.uuid4()
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            active_index_generation=1,
            pending_index_generation=2,
            pending_index_started_at=datetime(2026, 8, 15, 12, 0, 0),
            pending_index_heartbeat_at=datetime(2026, 8, 15, 12, 0, 0),
            pending_index_page_cursor=4,
            page_count=4,
            pending_index_lease_token=lease_token,
        )
        session = MagicMock()
        document_result = MagicMock()
        document_result.first.return_value = document
        count_result = MagicMock()
        count_result.one.return_value = (4, 4, 4)
        session.exec.side_effect = [document_result, count_result]

        activate_document_index_generation(
            session=session,
            document_id=document.id,
            index_generation=2,
            lease_token=lease_token,
        )

        self.assertEqual(document.active_index_generation, 2)
        self.assertEqual(document.active_index_page_cursor, 4)
        self.assertIsNone(document.pending_index_generation)
        self.assertIsNone(document.pending_index_page_cursor)
        session.commit.assert_called_once_with()

    def test_incomplete_generation_preserves_old_active_generation(self) -> None:
        lease_token = uuid.uuid4()
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            active_index_generation=1,
            pending_index_generation=2,
            pending_index_started_at=datetime(2026, 8, 15, 12, 0, 0),
            pending_index_heartbeat_at=datetime(2026, 8, 15, 12, 0, 0),
            pending_index_page_cursor=4,
            page_count=4,
            pending_index_lease_token=lease_token,
        )
        session = MagicMock()
        document_result = MagicMock()
        document_result.first.return_value = document
        count_result = MagicMock()
        count_result.one.return_value = (4, 3, 4)
        session.exec.side_effect = [document_result, count_result]

        with self.assertRaisesRegex(ValueError, "incomplete"):
            activate_document_index_generation(
                session=session,
                document_id=document.id,
                index_generation=2,
                lease_token=lease_token,
            )

        self.assertEqual(document.active_index_generation, 1)
        self.assertEqual(document.pending_index_generation, 2)
        session.commit.assert_not_called()
        session.rollback.assert_called_once_with()


class ReindexCheckpointTests(unittest.TestCase):
    def test_reindex_task_requeues_worker_loss_before_acknowledgement(self) -> None:
        self.assertTrue(reindex_document_task.acks_late)
        self.assertTrue(reindex_document_task.reject_on_worker_lost)

    def test_superseded_token_cannot_checkpoint_page(self) -> None:
        current_token = uuid.uuid4()
        heartbeat = datetime(2026, 8, 15, 12, 0, 0)
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            pending_index_generation=2,
            pending_index_started_at=heartbeat,
            pending_index_heartbeat_at=heartbeat,
            pending_index_page_cursor=1,
            pending_index_lease_token=current_token,
        )
        session = MagicMock()
        result = MagicMock()
        result.first.return_value = document
        session.exec.return_value = result

        with self.assertRaisesRegex(ValueError, "generation changed"):
            checkpoint_reindex_page(
                session=session,
                document_id=document.id,
                index_generation=2,
                lease_token=uuid.uuid4(),
                page_number=2,
                page_count=3,
                chunks=[DocumentChunkPayload("stale page", 2)],
            )

        self.assertEqual(session.exec.call_count, 1)
        self.assertEqual(document.pending_index_page_cursor, 1)
        self.assertEqual(document.pending_index_heartbeat_at, heartbeat)
        session.add_all.assert_not_called()
        session.commit.assert_not_called()

    def test_superseded_token_cannot_activate_generation(self) -> None:
        current_token = uuid.uuid4()
        heartbeat = datetime(2026, 8, 15, 12, 0, 0)
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            active_index_generation=1,
            pending_index_generation=2,
            pending_index_started_at=heartbeat,
            pending_index_heartbeat_at=heartbeat,
            pending_index_page_cursor=3,
            pending_index_lease_token=current_token,
            page_count=3,
        )
        session = MagicMock()
        result = MagicMock()
        result.first.return_value = document
        session.exec.return_value = result

        with self.assertRaisesRegex(ValueError, "generation changed"):
            activate_document_index_generation(
                session=session,
                document_id=document.id,
                index_generation=2,
                lease_token=uuid.uuid4(),
            )

        self.assertEqual(session.exec.call_count, 1)
        self.assertEqual(document.active_index_generation, 1)
        self.assertEqual(document.pending_index_generation, 2)
        self.assertEqual(document.pending_index_heartbeat_at, heartbeat)
        session.commit.assert_not_called()

    def test_superseded_token_cannot_claim_or_update_embedding_batch(self) -> None:
        current_token = uuid.uuid4()
        stale_token = uuid.uuid4()
        heartbeat = datetime(2026, 8, 15, 12, 0, 0)
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            pending_index_generation=2,
            pending_index_started_at=heartbeat,
            pending_index_heartbeat_at=heartbeat,
            pending_index_page_cursor=3,
            pending_index_lease_token=current_token,
        )
        chunk = DocumentChunk(
            document_id=document.id,
            index_generation=2,
            order_index=0,
            page_number=1,
            content="chunk",
        )

        claim_session = MagicMock()
        claim_result = MagicMock()
        claim_result.first.return_value = document
        claim_session.exec.return_value = claim_result
        with self.assertRaisesRegex(ValueError, "generation changed"):
            claim_reindex_embedding_batch(
                session=claim_session,
                document_id=document.id,
                index_generation=2,
                lease_token=stale_token,
                limit=24,
            )
        self.assertEqual(claim_session.exec.call_count, 1)
        claim_session.commit.assert_not_called()

        save_session = MagicMock()
        save_result = MagicMock()
        save_result.first.return_value = document
        save_session.exec.return_value = save_result
        with self.assertRaisesRegex(ValueError, "generation changed"):
            save_reindex_chunk_embeddings(
                session=save_session,
                document_id=document.id,
                index_generation=2,
                lease_token=stale_token,
                chunks=[chunk],
                embeddings=[[1.0] * 768],
            )
        self.assertIsNone(chunk.embedding)
        self.assertEqual(document.pending_index_heartbeat_at, heartbeat)
        save_session.add.assert_not_called()
        save_session.commit.assert_not_called()

    def test_retry_preserves_staged_lease_but_exhaustion_cleans_matching_token(self) -> None:
        document_id = uuid.uuid4()
        lease_token = uuid.uuid4()
        with (
            patch(
                "tasks.document_processing._reindex_completed_pdf",
                side_effect=RuntimeError("temporary failure"),
            ),
            patch.object(
                reindex_document_task,
                "retry",
                side_effect=RuntimeError("retry scheduled"),
            ) as retry,
            patch("tasks.document_processing.release_document_reindex_claim") as release,
        ):
            with self.assertRaisesRegex(RuntimeError, "retry scheduled"):
                reindex_document_task.run(str(document_id), 2, str(lease_token))

        retry.assert_called_once()
        release.assert_not_called()

        session = MagicMock()
        manager = MagicMock()
        manager.__enter__.return_value = session
        manager.__exit__.return_value = False
        with (
            patch(
                "tasks.document_processing._reindex_completed_pdf",
                side_effect=RuntimeError("terminal failure"),
            ),
            patch.object(reindex_document_task, "max_retries", 0),
            patch("tasks.document_processing.Session", return_value=manager),
            patch("tasks.document_processing.release_document_reindex_claim") as release,
        ):
            with self.assertRaisesRegex(RuntimeError, "terminal failure"):
                reindex_document_task.run(str(document_id), 2, str(lease_token))

        release.assert_called_once_with(
            session=session,
            document_id=document_id,
            index_generation=2,
            lease_token=lease_token,
            clean_staged=True,
        )

    def test_empty_page_advances_cursor_without_creating_a_chunk(self) -> None:
        now = datetime(2026, 8, 15, 12, 0, 0)
        lease_token = uuid.uuid4()
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            pending_index_generation=2,
            pending_index_started_at=now,
            pending_index_heartbeat_at=now,
            pending_index_page_cursor=0,
            pending_index_lease_token=lease_token,
        )
        session = MagicMock()
        document_result = MagicMock()
        document_result.first.return_value = document
        maximum_result = MagicMock()
        maximum_result.one.return_value = None
        session.exec.side_effect = [document_result, maximum_result]

        records = checkpoint_reindex_page(
            session=session,
            document_id=document.id,
            index_generation=2,
            lease_token=lease_token,
            page_number=1,
            page_count=3,
            chunks=[],
        )

        self.assertEqual(records, [])
        self.assertEqual(document.pending_index_page_cursor, 1)
        self.assertEqual(document.page_count, 3)
        session.add_all.assert_not_called()
        session.commit.assert_called_once_with()

    def test_page_checkpoint_assigns_generation_global_order_indexes(self) -> None:
        now = datetime(2026, 8, 15, 12, 0, 0)
        lease_token = uuid.uuid4()
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            pending_index_generation=2,
            pending_index_started_at=now,
            pending_index_heartbeat_at=now,
            pending_index_page_cursor=1,
            pending_index_lease_token=lease_token,
        )
        session = MagicMock()
        document_result = MagicMock()
        document_result.first.return_value = document
        maximum_result = MagicMock()
        maximum_result.one.return_value = 4
        session.exec.side_effect = [document_result, maximum_result]

        records = checkpoint_reindex_page(
            session=session,
            document_id=document.id,
            index_generation=2,
            lease_token=lease_token,
            page_number=2,
            page_count=3,
            chunks=[
                DocumentChunkPayload("first", 2),
                DocumentChunkPayload("second", 2),
            ],
        )

        self.assertEqual([chunk.order_index for chunk in records], [5, 6])
        self.assertTrue(all(chunk.index_generation == 2 for chunk in records))
        self.assertEqual(document.pending_index_page_cursor, 2)

    def test_interrupted_extraction_resumes_after_checkpointed_page(self) -> None:
        lease_token = uuid.uuid4()
        document = Document(
            id=uuid.uuid4(),
            filename="legacy.pdf",
            file_url="uploads/legacy.pdf",
            status=DocumentStatus.COMPLETED,
            active_index_generation=1,
            pending_index_generation=2,
            pending_index_started_at=datetime.now(timezone.utc),
            pending_index_heartbeat_at=datetime.now(timezone.utc),
            pending_index_page_cursor=0,
            pending_index_lease_token=lease_token,
        )
        session = MagicMock()
        manager = MagicMock()
        manager.__enter__.return_value = session
        manager.__exit__.return_value = False

        def interrupted_pages(*_args, **_kwargs):
            yield ExtractedPage(1, "page one")
            raise RuntimeError("worker interrupted")

        with (
            patch("tasks.document_processing.Session", return_value=manager),
            patch("tasks.document_processing._get_document", return_value=document),
            patch("tasks.document_processing.renew_document_reindex_lease", return_value=0),
            patch("tasks.document_processing.download_file_from_storage", return_value=b"pdf"),
            patch("tasks.document_processing.get_pdf_page_count", return_value=3),
            patch("tasks.document_processing.iter_pdf_pages", side_effect=interrupted_pages),
            patch("tasks.document_processing.checkpoint_reindex_page") as checkpoint,
            patch("tasks.document_processing.activate_document_index_generation") as activate,
        ):
            with self.assertRaisesRegex(RuntimeError, "interrupted"):
                _reindex_completed_pdf(str(document.id), 2, lease_token)

        checkpoint.assert_called_once()
        self.assertEqual(checkpoint.call_args.kwargs["page_number"], 1)
        activate.assert_not_called()
        self.assertEqual(document.active_index_generation, 1)

        with (
            patch("tasks.document_processing.Session", return_value=manager),
            patch("tasks.document_processing._get_document", return_value=document),
            patch("tasks.document_processing.renew_document_reindex_lease", return_value=1),
            patch("tasks.document_processing.download_file_from_storage", return_value=b"pdf"),
            patch("tasks.document_processing.get_pdf_page_count", return_value=3),
            patch(
                "tasks.document_processing.iter_pdf_pages",
                return_value=iter([ExtractedPage(2, "page two"), ExtractedPage(3, "page three")]),
            ) as pages,
            patch("tasks.document_processing.checkpoint_reindex_page") as checkpoint,
            patch("tasks.document_processing.claim_reindex_embedding_batch", return_value=[]),
            patch("tasks.document_processing.get_document_chunks", return_value=[MagicMock()]),
            patch("tasks.document_processing.activate_document_index_generation") as activate,
        ):
            _reindex_completed_pdf(str(document.id), 2, lease_token)

        self.assertEqual(pages.call_args.kwargs["start_page"], 2)
        self.assertEqual(
            [call.kwargs["page_number"] for call in checkpoint.call_args_list],
            [2, 3],
        )
        activate.assert_called_once()


class InitialUploadCheckpointTests(unittest.TestCase):
    def test_process_task_requeues_worker_loss_before_acknowledgement(self) -> None:
        self.assertTrue(process_document_task.acks_late)
        self.assertTrue(process_document_task.reject_on_worker_lost)

    def test_empty_active_page_advances_cursor_without_creating_a_chunk(self) -> None:
        document = Document(
            id=uuid.uuid4(),
            filename="new.pdf",
            file_url="uploads/new.pdf",
            status=DocumentStatus.EXTRACTING,
        )
        session = MagicMock()
        document_result = MagicMock()
        document_result.first.return_value = document
        maximum_result = MagicMock()
        maximum_result.one.return_value = None
        session.exec.side_effect = [document_result, maximum_result]

        records = checkpoint_active_index_page(
            session=session,
            document_id=document.id,
            index_generation=1,
            page_number=1,
            page_count=2,
            chunks=[],
        )

        self.assertEqual(records, [])
        self.assertEqual(document.active_index_page_cursor, 1)
        self.assertEqual(document.page_count, 2)
        session.add_all.assert_not_called()
        session.commit.assert_called_once_with()

    def test_in_flight_flat_pdf_index_is_not_mixed_with_page_aware_chunks(self) -> None:
        document = Document(
            id=uuid.uuid4(),
            filename="legacy-in-flight.pdf",
            file_url="uploads/legacy-in-flight.pdf",
            status=DocumentStatus.CHUNKING,
        )
        flat_chunk = DocumentChunk(
            document_id=document.id,
            index_generation=1,
            order_index=0,
            page_number=None,
            content="legacy flat chunk",
        )
        session = MagicMock()

        with (
            patch(
                "tasks.document_processing.get_document_chunks",
                return_value=[flat_chunk],
            ),
            patch("tasks.document_processing.download_file_from_storage") as download,
            patch("tasks.document_processing.checkpoint_active_index_page") as checkpoint,
        ):
            chunks = _extract_and_persist_chunks(session, document)

        self.assertEqual(chunks, [flat_chunk])
        self.assertEqual(document.active_index_page_cursor, 0)
        download.assert_not_called()
        checkpoint.assert_not_called()

    def test_interrupted_active_extraction_resumes_after_checkpointed_page(self) -> None:
        document = Document(
            id=uuid.uuid4(),
            filename="new.pdf",
            file_url="uploads/new.pdf",
            status=DocumentStatus.PENDING,
        )
        session = MagicMock()

        def interrupted_pages(*_args, **_kwargs):
            yield ExtractedPage(1, "page one")
            raise RuntimeError("worker interrupted")

        def advance_cursor(**kwargs):
            document.active_index_page_cursor = kwargs["page_number"]
            return []

        with (
            patch(
                "tasks.document_processing.get_document_chunks",
                return_value=[],
            ),
            patch("tasks.document_processing.update_document_status"),
            patch("tasks.document_processing.download_file_from_storage", return_value=b"pdf"),
            patch("tasks.document_processing.get_pdf_page_count", return_value=3),
            patch("tasks.document_processing.iter_pdf_pages", side_effect=interrupted_pages),
            patch(
                "tasks.document_processing.checkpoint_active_index_page",
                side_effect=advance_cursor,
            ) as checkpoint,
        ):
            with self.assertRaisesRegex(RuntimeError, "interrupted"):
                _extract_and_persist_chunks(session, document)

        self.assertEqual(document.active_index_page_cursor, 1)
        self.assertEqual(checkpoint.call_args.kwargs["page_number"], 1)

        first_chunk = DocumentChunk(
            document_id=document.id,
            index_generation=1,
            order_index=0,
            page_number=1,
            content="page one",
        )
        completed_chunks = [
            first_chunk,
            DocumentChunk(
                document_id=document.id,
                index_generation=1,
                order_index=1,
                page_number=2,
                content="page two",
            ),
            DocumentChunk(
                document_id=document.id,
                index_generation=1,
                order_index=2,
                page_number=3,
                content="page three",
            ),
        ]
        with (
            patch(
                "tasks.document_processing.get_document_chunks",
                side_effect=[[first_chunk], completed_chunks],
            ),
            patch("tasks.document_processing.update_document_status"),
            patch("tasks.document_processing.download_file_from_storage", return_value=b"pdf"),
            patch("tasks.document_processing.get_pdf_page_count", return_value=3),
            patch(
                "tasks.document_processing.iter_pdf_pages",
                return_value=iter(
                    [ExtractedPage(2, "page two"), ExtractedPage(3, "page three")]
                ),
            ) as pages,
            patch(
                "tasks.document_processing.checkpoint_active_index_page",
                side_effect=advance_cursor,
            ) as checkpoint,
        ):
            chunks = _extract_and_persist_chunks(session, document)

        self.assertEqual(pages.call_args.kwargs["start_page"], 2)
        self.assertEqual(
            [call.kwargs["page_number"] for call in checkpoint.call_args_list],
            [2, 3],
        )
        self.assertEqual(chunks, completed_chunks)


class PageAwareMigrationTests(unittest.TestCase):
    def test_downgrade_deletes_non_active_generations_before_columns(self) -> None:
        migration_path = (
            Path(__file__).parent
            / "alembic/versions/20260815_0001_add_page_aware_index_generations.py"
        )
        spec = importlib.util.spec_from_file_location("page_aware_migration", migration_path)
        self.assertIsNotNone(spec)
        self.assertIsNotNone(spec.loader if spec else None)
        migration = importlib.util.module_from_spec(spec)
        assert spec is not None and spec.loader is not None
        spec.loader.exec_module(migration)
        operations = MagicMock()
        with patch.object(migration, "op", operations):
            migration.downgrade()

        delete_sql = operations.execute.call_args.args[0]
        self.assertIn("DELETE FROM document_chunks AS chunks", delete_sql)
        self.assertIn(
            "chunks.index_generation <> documents.active_index_generation",
            delete_sql,
        )
        method_names = [call[0] for call in operations.method_calls]
        self.assertLess(method_names.index("execute"), method_names.index("drop_column"))


if __name__ == "__main__":
    unittest.main()
