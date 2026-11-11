from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlmodel import Session
from core.auth import get_current_user, CurrentUser

from core.database import get_session
from models.tables import DocumentStatus
from services.documents import create_document_record, update_document_status
from services.storage import (
    StorageServiceError,
    build_storage_path,
    delete_file_from_storage,
    upload_file_to_storage,
)
from tasks.document_processing import process_document_task
from core.task_provenance import build_task_headers

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".pptx",
    ".epub",
    ".txt",
    ".md",
    ".csv",
    ".rtf",
    ".html",
    ".htm",
}

EXTENSION_CONTENT_TYPES: dict[str, set[str]] = {
    ".pdf": {"application/pdf"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
    },
    ".pptx": {
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip",
    },
    ".epub": {
        "application/epub+zip",
        "application/zip",
    },
    ".txt": {
        "text/plain",
    },
    ".md": {
        "text/markdown",
        "text/x-markdown",
        "text/plain",
    },
    ".csv": {
        "text/csv",
        "application/csv",
        "text/comma-separated-values",
        "text/plain",
    },
    ".rtf": {
        "application/rtf",
        "text/rtf",
        "text/richtext",
        "text/plain",
    },
    ".html": {
        "text/html",
    },
    ".htm": {
        "text/html",
    },
}

GENERIC_CONTENT_TYPES = {
    "application/octet-stream",
    "application/x-zip-compressed",
    "binary/octet-stream",
}

ALLOWED_CONTENT_TYPES = set().union(*EXTENSION_CONTENT_TYPES.values(), GENERIC_CONTENT_TYPES)


class UploadResponse(BaseModel):
    document_id: uuid.UUID
    status: str
    file_url: str


def validate_upload(file: UploadFile, file_bytes: bytes) -> None:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A filename is required.",
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unsupported file format. Supported formats: "
                "PDF, PPTX, DOCX, EPUB, TXT, MD, CSV, RTF, HTML."
            ),
        )

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    content_type = (file.content_type or "").lower().split(";")[0].strip()
    allowed_types = EXTENSION_CONTENT_TYPES.get(extension, set())
    is_generic = content_type in GENERIC_CONTENT_TYPES or not content_type
    is_text_type = content_type.startswith("text/") and extension in {
        ".txt",
        ".md",
        ".csv",
        ".rtf",
        ".html",
        ".htm",
    }

    if content_type not in allowed_types and not is_generic and not is_text_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file content type '{file.content_type}' for {extension} file.",
        )

    # Magic byte and structural sanity checks
    if extension == ".pdf":
        if not file_bytes.startswith(b"%PDF") and b"%PDF" not in file_bytes[:1024]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not appear to be a valid PDF.",
            )
    elif extension in {".docx", ".pptx", ".epub"}:
        if not file_bytes.startswith(b"PK\x03\x04"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File content does not appear to be a valid {extension.lstrip('.').upper()} archive.",
            )
    elif extension == ".rtf":
        if b"{\\rtf" not in file_bytes[:128]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not appear to be a valid RTF document.",
            )
    else:  # txt, md, csv, html, htm
        if file_bytes.count(b"\x00") > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File contains binary data. Please upload a plain text study material.",
            )


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    user_id: uuid.UUID | None = Form(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UploadResponse:
    try:
        try:
            file_bytes = await file.read()
            validate_upload(file, file_bytes)

            document_id = uuid.uuid4()
            storage_path = build_storage_path(str(document_id), file.filename)
            file_url = upload_file_to_storage(
                content=file_bytes,
                destination_path=storage_path,
                content_type=file.content_type,
            )
        except StorageServiceError as exc:
            logger.exception(
                "Upload storage failure for file '%s' and user '%s'.",
                file.filename,
                current_user.clerk_user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=str(exc),
            ) from exc

        try:
            document = create_document_record(
                session=session,
                document_id=document_id,
                filename=file.filename,
                file_url=file_url,
                file_size_bytes=len(file_bytes),
                user_id=user_id,
                clerk_user_id=current_user.clerk_user_id,
            )
        except Exception as exc:
            logger.exception(
                "Upload database failure for file '%s', storage path '%s', and user '%s'.",
                file.filename,
                file_url,
                current_user.clerk_user_id,
            )
            try:
                delete_file_from_storage(file_url)
            except StorageServiceError:
                logger.warning(
                    "Upload cleanup failed for storage path '%s' after document creation error.",
                    file_url,
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create the document record.",
            ) from exc

        try:
            task_arguments = (str(document.id),)
            process_document_task.apply_async(
                args=task_arguments,
                headers=build_task_headers(
                    "process_document",
                    current_user.clerk_user_id,
                    task_arguments,
                ),
            )
        except Exception as exc:
            logger.exception(
                "Upload queue failure for document '%s' and user '%s'.",
                document.id,
                current_user.clerk_user_id,
            )
            update_document_status(
                session=session,
                document=document,
                status=DocumentStatus.FAILED,
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Document was saved, but background processing could not be queued.",
            ) from exc

        return UploadResponse(
            document_id=document.id,
            status=document.status.value,
            file_url=document.file_url,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            "Unexpected upload failure for file '%s' and user '%s'.",
            file.filename,
            current_user.clerk_user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upload failed unexpectedly. Check backend logs.",
        ) from exc
