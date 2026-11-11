from __future__ import annotations

import csv
import io
import logging
import math
import re
import subprocess
import zipfile
from collections.abc import Iterator
from dataclasses import dataclass
from html.parser import HTMLParser
from xml.etree import ElementTree

import fitz

logger = logging.getLogger(__name__)


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
        safe_dpi = min(dpi, 200)
        image_bytes = page.get_pixmap(dpi=safe_dpi, alpha=False).tobytes("png")
        result = subprocess.run(
            ["tesseract", "stdin", "stdout", "-l", language],
            input=image_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            timeout=60,
        )
        return normalize_text(result.stdout.decode("utf-8", errors="replace"))
    except Exception as exc:
        logger.warning(
            "OCR failed for PDF page %s: %s; falling back to native text",
            getattr(page, "number", "unknown"),
            exc,
        )
        return ""


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


class HTMLTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.text_parts: list[str] = []
        self._ignore: bool = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag_lower = tag.lower()
        if tag_lower in ("script", "style", "noscript", "svg"):
            self._ignore = True
        elif tag_lower in ("p", "div", "br", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr"):
            self.text_parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        tag_lower = tag.lower()
        if tag_lower in ("script", "style", "noscript", "svg"):
            self._ignore = False
        elif tag_lower in ("p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr"):
            self.text_parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self._ignore:
            self.text_parts.append(data)

    def get_text(self) -> str:
        return "".join(self.text_parts)


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

    normalized = normalize_text("\n".join(paragraphs))
    if not normalized:
        raise DocumentProcessingError("No extractable text found in DOCX document.")
    word_count = len(normalized.split())
    estimated_pages = max(1, math.ceil(word_count / 300))
    return normalized, estimated_pages


def extract_pptx_pages(file_bytes: bytes) -> tuple[list[ExtractedPage], int]:
    try:
        archive = zipfile.ZipFile(io.BytesIO(file_bytes))
    except Exception as exc:
        raise DocumentProcessingError("Failed to open PowerPoint presentation.") from exc

    with archive:
        namelist = set(archive.namelist())

        ordered_slides: list[str] = []
        if "ppt/presentation.xml" in namelist and "ppt/_rels/presentation.xml.rels" in namelist:
            try:
                pres_tree = ElementTree.fromstring(archive.read("ppt/presentation.xml"))
                rels_tree = ElementTree.fromstring(archive.read("ppt/_rels/presentation.xml.rels"))
                id_to_target: dict[str, str] = {}
                for rel in rels_tree:
                    r_id = rel.attrib.get("Id")
                    target = rel.attrib.get("Target")
                    if r_id and target:
                        if not target.startswith("ppt/"):
                            target = "ppt/" + target.lstrip("/")
                        id_to_target[r_id] = target

                for sld in pres_tree.findall(".//{http://schemas.openxmlformats.org/presentationml/2006/main}sldId"):
                    r_id = sld.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
                    if r_id and r_id in id_to_target:
                        target = id_to_target[r_id]
                        if target in namelist:
                            ordered_slides.append(target)
            except Exception:
                ordered_slides = []

        if not ordered_slides:
            slide_candidates = [
                n for n in namelist
                if re.match(r"^ppt/slides/slide\d+\.xml$", n)
            ]
            ordered_slides = sorted(
                slide_candidates,
                key=lambda p: int(re.search(r"\d+", p).group()) if re.search(r"\d+", p) else 0,
            )

        if not ordered_slides:
            raise DocumentProcessingError("No slides found in PowerPoint presentation.")

        def extract_text_from_xml(xml_bytes: bytes) -> list[str]:
            root = ElementTree.fromstring(xml_bytes)
            paragraphs: list[str] = []
            for p in root.iter():
                if p.tag.endswith("}p"):
                    runs: list[str] = []
                    for t in p.iter():
                        if t.tag.endswith("}t") and t.text:
                            runs.append(t.text)
                    line = "".join(runs).strip()
                    if line:
                        paragraphs.append(line)
            return paragraphs

        pages: list[ExtractedPage] = []
        for slide_index, slide_path in enumerate(ordered_slides, start=1):
            slide_xml = archive.read(slide_path)
            slide_paragraphs = extract_text_from_xml(slide_xml)

            # Look for corresponding speaker notes
            slide_filename = slide_path.split("/")[-1]
            slide_rel_path = f"ppt/slides/_rels/{slide_filename}.rels"
            notes_xml_path: str | None = None
            if slide_rel_path in namelist:
                try:
                    srels = ElementTree.fromstring(archive.read(slide_rel_path))
                    for r in srels:
                        if r.attrib.get("Type", "").endswith("notesSlide"):
                            target = r.attrib.get("Target", "")
                            norm_target = "ppt/" + target.replace("../", "").lstrip("/")
                            if norm_target in namelist:
                                notes_xml_path = norm_target
                                break
                except Exception:
                    pass

            if not notes_xml_path:
                candidate = f"ppt/notesSlides/notesSlide{slide_index}.xml"
                if candidate in namelist:
                    notes_xml_path = candidate

            if notes_xml_path and notes_xml_path in namelist:
                notes_paragraphs = extract_text_from_xml(archive.read(notes_xml_path))
                if notes_paragraphs:
                    slide_paragraphs.append(f"Speaker Notes: {' '.join(notes_paragraphs)}")

            slide_text = normalize_text("\n".join(slide_paragraphs))
            if slide_text:
                pages.append(ExtractedPage(page_number=slide_index, text=slide_text))

        if not pages:
            raise DocumentProcessingError("No extractable text found in PowerPoint presentation.")

        return pages, len(ordered_slides)


def extract_epub_pages(file_bytes: bytes) -> tuple[list[ExtractedPage], int]:
    try:
        with fitz.open(stream=file_bytes, filetype="epub") as doc:
            pages: list[ExtractedPage] = []
            for page_index in range(doc.page_count):
                page_text = normalize_text(doc[page_index].get_text("text"))
                if page_text:
                    pages.append(ExtractedPage(page_number=page_index + 1, text=page_text))
            if not pages:
                raise DocumentProcessingError("No extractable text found in EPUB e-book.")
            return pages, doc.page_count
    except DocumentProcessingError:
        raise
    except Exception as exc:
        raise DocumentProcessingError("Failed to extract text from EPUB e-book.") from exc


def extract_text_document(file_bytes: bytes, extension: str) -> tuple[str, int]:
    decoded: str | None = None
    for encoding in ("utf-8-sig", "utf-16", "cp1252", "latin-1"):
        try:
            candidate = file_bytes.decode(encoding)
            if candidate.count("\x00") <= 5:
                decoded = candidate
                break
        except (UnicodeDecodeError, LookupError):
            continue

    if decoded is None:
        raise DocumentProcessingError("Failed to decode text document. Unsupported encoding.")

    ext = extension.lower().lstrip(".")
    if ext in ("html", "htm"):
        parser = HTMLTextExtractor()
        parser.feed(decoded)
        extracted = parser.get_text()
    elif ext in ("csv", "tsv"):
        delimiter = "\t" if ext == "tsv" else ","
        reader = csv.reader(io.StringIO(decoded), delimiter=delimiter)
        rows = list(reader)
        if not rows:
            extracted = ""
        else:
            headers = [h.strip() for h in rows[0]]
            if len(rows) > 1 and any(headers):
                lines: list[str] = []
                for row in rows[1:]:
                    parts = [
                        f"{headers[i] if i < len(headers) and headers[i] else f'Col{i+1}'}: {cell.strip()}"
                        for i, cell in enumerate(row)
                        if cell.strip()
                    ]
                    if parts:
                        lines.append(" | ".join(parts))
                extracted = "\n".join(lines) if lines else "\n".join(" | ".join(c.strip() for c in r if c.strip()) for r in rows)
            else:
                extracted = "\n".join(" | ".join(c.strip() for c in r if c.strip()) for r in rows)
    elif ext == "rtf":
        cleaned = re.sub(r"\{\\(?:fonttbl|colortbl|stylesheet|info|\*)[^}]*\}", "", decoded, flags=re.DOTALL)
        cleaned = re.sub(r"\\par(?:d)?(?:\s+)?", "\n", cleaned)
        cleaned = re.sub(r"\\line(?:\s+)?", "\n", cleaned)
        cleaned = re.sub(r"\\tab(?:\s+)?", "\t", cleaned)
        cleaned = re.sub(r"\\[a-zA-Z]+(?:-?\d+)?(?:\s)?", "", cleaned)
        cleaned = re.sub(r"[{}]", "", cleaned)
        extracted = cleaned
    else:  # txt, md, etc.
        extracted = decoded

    normalized = normalize_text(extracted)
    if not normalized:
        raise DocumentProcessingError("No extractable text found in document.")

    word_count = len(normalized.split())
    estimated_pages = max(1, math.ceil(word_count / 300))
    return normalized, estimated_pages


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
