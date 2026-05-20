from __future__ import annotations

import io
import zipfile
from xml.etree import ElementTree

import fitz


class DocumentProcessingError(Exception):
    """Raised when document extraction or chunking fails."""


def extract_pdf_text(file_bytes: bytes) -> tuple[str, int]:
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as pdf_document:
            page_count = pdf_document.page_count
            text = "\n".join(page.get_text("text") for page in pdf_document)
    except Exception as exc:  # pragma: no cover - parser errors vary by document
        raise DocumentProcessingError("Failed to extract text from PDF.") from exc

    return normalize_text(text), page_count


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
