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

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class UploadResponse(BaseModel):
    document_id: uuid.UUID
    status: str
    file_url: str


def validate_upload(file: UploadFile, file_bytes: bytes) -> None:
    extension = Path(file.filename or "").suffix.lower()

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A filename is required.",
        )

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are allowed.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file content type.",
        )

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
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
