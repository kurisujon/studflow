from __future__ import annotations

import json
import unittest
import uuid
from datetime import datetime
from unittest.mock import MagicMock, patch

from sqlalchemy.dialects import postgresql

from api.routes.documents import (
    SUMMARY_LIBRARY_KEY_TAKEAWAY_LIMIT,
    SUMMARY_LIBRARY_KEY_TAKEAWAY_MAX_LENGTH,
    SUMMARY_LIBRARY_OVERVIEW_MAX_LENGTH,
    SUMMARY_LIBRARY_TERM_LIMIT,
    SUMMARY_LIBRARY_TERM_MAX_LENGTH,
    SUMMARY_LIBRARY_TOPIC_LIMIT,
    SUMMARY_LIBRARY_TOPIC_MAX_LENGTH,
    _build_summary_library_item,
    list_summaries,
)
from core.auth import CurrentUser
from models.tables import Document, DocumentStatus, Summary


def _payload(section_count: int = 1) -> str:
    return json.dumps(
        {
            "overall_overview": "  A structured   overview.  ",
            "detailed_sections": [
                {
                    "topic_title": f"Topic {index}",
                    "key_points": [
                        f"Point {index}-{point}" for point in range(4)
                    ],
                    "important_terms_and_definitions": [f"Term {index}"],
                }
                for index in range(section_count)
            ],
        }
    )


def _models(content: str, *, owner: str = "user_123") -> tuple[Document, Summary]:
    document_id = uuid.uuid4()
    document = Document(
        id=document_id,
        clerk_user_id=owner,
        filename="Biology.pdf",
        file_url="uploads/biology.pdf",
        status=DocumentStatus.COMPLETED,
        page_count=12,
        created_at=datetime(2026, 7, 1),
    )
    summary = Summary(
        id=uuid.uuid4(),
        document_id=document_id,
        content=content,
        created_at=datetime(2026, 7, 2),
    )
    return document, summary


class SummaryLibraryMappingTests(unittest.TestCase):
    def test_mapping_normalizes_and_enforces_preview_bounds(self) -> None:
        long_value = "word " * 100
        content = json.dumps(
            {
                "overall_overview": "overview " * 200,
                "detailed_sections": [
                    {
                        "topic_title": f"Topic {index} {long_value}",
                        "key_points": [
                            f"Point {index}-{point} {long_value}"
                            for point in range(4)
                        ],
                        "important_terms_and_definitions": [
                            f"Term {index} {long_value}"
                        ],
                    }
                    for index in range(6)
                ],
            }
        )
        document, summary = _models(content)

        item = _build_summary_library_item(document, summary)

        self.assertIsNotNone(item)
        assert item is not None
        self.assertEqual(item.document_id, document.id)
        self.assertEqual(item.filename, document.filename)
        self.assertEqual(item.document_created_at, document.created_at)
        self.assertEqual(item.summary_created_at, summary.created_at)
        self.assertEqual(item.page_count, 12)
        self.assertEqual(item.topic_count, 6)
        self.assertEqual(len(item.overview), SUMMARY_LIBRARY_OVERVIEW_MAX_LENGTH)
        self.assertEqual(len(item.topics), SUMMARY_LIBRARY_TOPIC_LIMIT)
        self.assertEqual(len(item.key_takeaways), SUMMARY_LIBRARY_KEY_TAKEAWAY_LIMIT)
        self.assertEqual(len(item.important_terms), SUMMARY_LIBRARY_TERM_LIMIT)
        self.assertTrue(all(len(value) <= SUMMARY_LIBRARY_TOPIC_MAX_LENGTH for value in item.topics))
        self.assertTrue(all(len(value) <= SUMMARY_LIBRARY_KEY_TAKEAWAY_MAX_LENGTH for value in item.key_takeaways))
        self.assertTrue(all(len(value) <= SUMMARY_LIBRARY_TERM_MAX_LENGTH for value in item.important_terms))
        self.assertTrue(item.overview.endswith("…"))

    def test_malformed_or_empty_structured_content_is_omitted(self) -> None:
        for content in ("", "not json", json.dumps({"overall_overview": "missing sections"})):
            with self.subTest(content=content):
                document, summary = _models(content)
                self.assertIsNone(_build_summary_library_item(document, summary))


class SummaryLibraryEndpointTests(unittest.TestCase):
    @patch("api.routes.documents.logger.warning")
    @patch("api.routes.documents.Session")
    def test_list_uses_one_owned_completed_join_and_omits_malformed(
        self,
        session_factory: MagicMock,
        warning: MagicMock,
    ) -> None:
        valid_document, valid_summary = _models(_payload())
        invalid_document, invalid_summary = _models("private malformed content")
        session = MagicMock()
        session.exec.return_value.all.return_value = [
            (valid_document, valid_summary),
            (invalid_document, invalid_summary),
        ]
        session_factory.return_value.__enter__.return_value = session

        items = list_summaries(CurrentUser(clerk_user_id="user_123"), session=session)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].document_id, valid_document.id)
        session.exec.assert_called_once()
        statement = session.exec.call_args.args[0]
        compiled = str(statement.compile(dialect=postgresql.dialect()))
        self.assertIn("JOIN summaries", compiled)
        self.assertIn("documents.clerk_user_id", compiled)
        self.assertIn("documents.status", compiled)
        self.assertIn("ORDER BY summaries.created_at DESC, documents.id ASC", compiled)
        warning.assert_called_once_with(
            "Omitting invalid summary library item summary_id=%s document_id=%s",
            invalid_summary.id,
            invalid_document.id,
        )
        warning_text = " ".join(str(value) for value in warning.call_args.args)
        self.assertNotIn(invalid_summary.content, warning_text)


if __name__ == "__main__":
    unittest.main()
