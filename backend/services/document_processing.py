from __future__ import annotations

import io
import subprocess
import zipfile
from collections.abc import Iterator
from dataclasses import dataclass
from xml.etree import ElementTree

import fitz


class DocumentProcessingError(Exception):
    """Raised when document extraction or chunking fails."""


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int
    text: str


@dataclass(frozen=True)
class DocumentChunkPayload:
    content: str
    page_number: int | None


def _ocr_pdf_page(
    page: fitz.Page,
    *,
    language: str,
    dpi: int,
) -> str:
    try:
        image_bytes = page.get_pixmap(dpi=dpi, alpha=False).tobytes("png")
        result = subprocess.run(
            ["tesseract", "stdin", "stdout", "-l", language],
            input=image_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            timeout=120,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        raise DocumentProcessingError("Failed to OCR a PDF page.") from exc
    return normalize_text(result.stdout.decode("utf-8", errors="replace"))


def extract_pdf_pages(
    file_bytes: bytes,
    *,
    ocr_enabled: bool = False,
    ocr_language: str = "eng",
    ocr_dpi: int = 300,
    ocr_min_text_chars: int = 40,
) -> tuple[list[ExtractedPage], int]:
    """Extract each PDF page independently, OCRing only text-sparse pages."""
    page_count = get_pdf_page_count(file_bytes)
    pages = list(
        iter_pdf_pages(
            file_bytes,
            start_page=1,
            ocr_enabled=ocr_enabled,
            ocr_language=ocr_language,
            ocr_dpi=ocr_dpi,
            ocr_min_text_chars=ocr_min_text_chars,
        )
    )
    return pages, page_count


def get_pdf_page_count(file_bytes: bytes) -> int:
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as pdf_document:
            return pdf_document.page_count
    except Exception as exc:  # pragma: no cover - parser errors vary by document
        raise DocumentProcessingError("Failed to read PDF page count.") from exc


def iter_pdf_pages(
    file_bytes: bytes,
    *,
    start_page: int = 1,
    ocr_enabled: bool = False,
    ocr_language: str = "eng",
    ocr_dpi: int = 300,
    ocr_min_text_chars: int = 40,
) -> Iterator[ExtractedPage]:
    """Yield PDF pages sequentially from a one-based resume cursor."""
    if start_page < 1:
        raise DocumentProcessingError("PDF start page must be at least one.")
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as pdf_document:
            for page_index in range(start_page - 1, pdf_document.page_count):
                page = pdf_document[page_index]
                native_text = normalize_text(page.get_text("text"))
                page_text = native_text
                if ocr_enabled and len(native_text) < ocr_min_text_chars:
                    ocr_text = _ocr_pdf_page(
                        page,
                        language=ocr_language,
                        dpi=ocr_dpi,
                    )
                    if len(ocr_text) > len(native_text):
                        page_text = ocr_text
                yield ExtractedPage(
                    page_number=page_index + 1,
                    text=page_text,
                )
    except DocumentProcessingError:
        raise
    except Exception as exc:  # pragma: no cover - parser errors vary by document
        raise DocumentProcessingError("Failed to extract text from PDF.") from exc


def extract_pdf_text(file_bytes: bytes) -> tuple[str, int]:
    pages, page_count = extract_pdf_pages(file_bytes)
    return normalize_text("\n".join(page.text for page in pages)), page_count


def extract_docx_text(file_bytes: bytes) -> tuple[str, int]:
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx_archive:
            document_xml = docx_archive.read("word/document.xml")
    except Exception as exc:  # pragma: no cover - parser errors vary by document
        raise DocumentProcessingError("Failed to read DOCX document.") from exc

    root = ElementTree.fromstring(document_xml)
    namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = []

    for paragraph in root.findall(".//w:p", namespaces):
        runs = [node.text for node in paragraph.findall(".//w:t", namespaces) if node.text]
        if runs:
            paragraphs.append("".join(runs))

    return normalize_text("\n".join(paragraphs)), len(paragraphs)


def normalize_text(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    compact_lines = [line for line in lines if line]
    return "\n".join(compact_lines).strip()


def chunk_text(text: str, chunk_size: int = 2000, overlap: int = 200) -> list[str]:
    words = text.split()
    if not words:
        return []

    if chunk_size <= 0:
        raise DocumentProcessingError("Chunk size must be greater than zero.")

    if overlap < 0 or overlap >= chunk_size:
        raise DocumentProcessingError("Overlap must be zero or smaller than chunk size.")

    chunks: list[str] = []
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start = end - overlap

    return chunks


def chunk_pdf_pages(
    pages: list[ExtractedPage],
    *,
    chunk_size: int = 2000,
    overlap: int = 200,
) -> list[DocumentChunkPayload]:
    """Chunk within page boundaries so every PDF citation maps to one page."""
    chunks: list[DocumentChunkPayload] = []
    for page in pages:
        chunks.extend(
            DocumentChunkPayload(content=content, page_number=page.page_number)
            for content in chunk_text(page.text, chunk_size=chunk_size, overlap=overlap)
        )
    return chunks


def chunk_docx_text(
    text: str,
    *,
    chunk_size: int = 2000,
    overlap: int = 200,
) -> list[DocumentChunkPayload]:
    return [
        DocumentChunkPayload(content=content, page_number=None)
        for content in chunk_text(text, chunk_size=chunk_size, overlap=overlap)
    ]
