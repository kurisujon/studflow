from __future__ import annotations

import unittest
import uuid
from unittest.mock import patch

from core.task_provenance import (
    HEADER_SIGNATURE,
    HEADER_TENANT,
    TaskProvenanceError,
    build_task_headers,
    retry_headers,
    verify_task_headers,
)
from tasks.document_processing import (
    process_document_task,
    reindex_document_task,
    repair_document_index_task,
)


class TaskProvenanceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.document_id = str(uuid.uuid4())
        self.tenant_id = "user_owner_123"
        self.arguments = (self.document_id,)

    def test_signed_task_binds_operation_arguments_and_tenant(self) -> None:
        headers = build_task_headers("process_document", self.tenant_id, self.arguments)
        self.assertEqual(
            verify_task_headers(headers, "process_document", self.arguments),
            self.tenant_id,
        )
        for operation, arguments in (
            ("repair_document_index", self.arguments),
            ("process_document", (str(uuid.uuid4()),)),
        ):
            with self.assertRaises(TaskProvenanceError):
                verify_task_headers(headers, operation, arguments)

    def test_forged_tenant_and_signature_are_rejected(self) -> None:
        headers = build_task_headers("process_document", self.tenant_id, self.arguments)
        forged_tenant = dict(headers)
        forged_tenant[HEADER_TENANT] = "user_attacker"
        forged_signature = dict(headers)
        forged_signature[HEADER_SIGNATURE] = "0" * 64
        for candidate in (forged_tenant, forged_signature):
            with self.assertRaises(TaskProvenanceError):
                verify_task_headers(candidate, "process_document", self.arguments)

    def test_legacy_task_without_headers_is_rejected_before_database_access(self) -> None:
        with patch("tasks.document_processing._run_pipeline") as pipeline:
            result = process_document_task.apply(
                args=self.arguments,
                headers={},
                throw=False,
            )
        self.assertTrue(result.failed())
        self.assertIsInstance(result.result, TaskProvenanceError)
        pipeline.assert_not_called()

    def test_all_legacy_task_shapes_are_rejected_before_database_access(self) -> None:
        lease_token = str(uuid.uuid4())
        cases = (
            (
                repair_document_index_task,
                (self.document_id,),
                "tasks.document_processing._repair_completed_document_index",
            ),
            (
                reindex_document_task,
                (self.document_id, 2, lease_token),
                "tasks.document_processing._reindex_completed_pdf",
            ),
        )
        for task, arguments, target in cases:
            with self.subTest(task=task.name), patch(target) as database_operation:
                result = task.apply(args=arguments, headers={}, throw=False)
                self.assertTrue(result.failed())
                self.assertIsInstance(result.result, TaskProvenanceError)
                database_operation.assert_not_called()

    def test_reindex_provenance_binds_generation_and_lease(self) -> None:
        arguments = (self.document_id, 2, str(uuid.uuid4()))
        headers = build_task_headers("reindex_document", self.tenant_id, arguments)
        for tampered in (
            (self.document_id, 3, arguments[2]),
            (self.document_id, 2, str(uuid.uuid4())),
        ):
            with self.assertRaises(TaskProvenanceError):
                verify_task_headers(headers, "reindex_document", tampered)

    def test_valid_task_uses_authenticated_tenant(self) -> None:
        headers = build_task_headers("process_document", self.tenant_id, self.arguments)
        expected = {"document_id": self.document_id, "status": "completed"}
        with patch("tasks.document_processing._run_pipeline", return_value=expected) as pipeline:
            result = process_document_task.apply(
                args=self.arguments,
                headers=headers,
                throw=True,
            )
        self.assertEqual(result.result, expected)
        pipeline.assert_called_once_with(self.document_id, self.tenant_id)

    def test_extra_provenance_headers_are_rejected(self) -> None:
        headers = build_task_headers("process_document", self.tenant_id, self.arguments)
        headers["untrusted-extra"] = "discard-me"
        with self.assertRaises(TaskProvenanceError):
            verify_task_headers(headers, "process_document", self.arguments)
        with self.assertRaises(TaskProvenanceError):
            retry_headers(headers)

    def test_processing_retry_preserves_verified_provenance(self) -> None:
        headers = build_task_headers("process_document", self.tenant_id, self.arguments)
        with (
            patch(
                "tasks.document_processing._run_pipeline",
                side_effect=RuntimeError("temporary"),
            ),
            patch.object(
                process_document_task,
                "retry",
                side_effect=RuntimeError("retry scheduled"),
            ) as retry,
        ):
            result = process_document_task.apply(
                args=self.arguments,
                headers=headers,
                throw=False,
            )
        self.assertTrue(result.failed())
        self.assertEqual(retry.call_args.kwargs["headers"], headers)
        self.assertEqual(
            verify_task_headers(
                retry.call_args.kwargs["headers"],
                "process_document",
                self.arguments,
            ),
            self.tenant_id,
        )

    def test_terminal_cleanup_failure_does_not_mask_primary_error(self) -> None:
        headers = build_task_headers("process_document", self.tenant_id, self.arguments)
        with (
            patch(
                "tasks.document_processing._run_pipeline",
                side_effect=RuntimeError("primary processing failure"),
            ),
            patch.object(process_document_task, "max_retries", 0),
            patch(
                "tasks.document_processing.tenant_session",
                side_effect=RuntimeError("cleanup failure"),
            ),
        ):
            result = process_document_task.apply(
                args=self.arguments,
                headers=headers,
                throw=False,
            )
        self.assertTrue(result.failed())
        self.assertEqual(str(result.result), "primary processing failure")


if __name__ == "__main__":
    unittest.main()
