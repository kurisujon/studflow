import io
import unittest
import zipfile
from unittest.mock import MagicMock

from fastapi import HTTPException, UploadFile

from api.routes.upload import validate_upload
from services.document_processing import (
    DocumentProcessingError,
    chunk_docx_text,
    chunk_pdf_pages,
    extract_docx_text,
    extract_epub_pages,
    extract_pptx_pages,
    extract_text_document,
)


def _make_upload_file(filename: str, content_type: str) -> UploadFile:
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = filename
    mock_file.content_type = content_type
    return mock_file


def _create_sample_pptx() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(
            "ppt/presentation.xml",
            """<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                <p:sldIdLst>
                    <p:sldId id="256" r:id="rId1"/>
                    <p:sldId id="257" r:id="rId2"/>
                </p:sldIdLst>
            </p:presentation>""",
        )
        z.writestr(
            "ppt/_rels/presentation.xml.rels",
            """<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
                <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
            </Relationships>""",
        )
        z.writestr(
            "ppt/slides/slide1.xml",
            """<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                <p:cSld>
                    <p:spTree>
                        <p:sp><p:txBody><a:p><a:r><a:t>Introduction to Cellular Biology</a:t></a:r></a:p></p:txBody></p:sp>
                        <p:sp><p:txBody><a:p><a:r><a:t>Slide 1 Subtitle: Cells and Organelles</a:t></a:r></a:p></p:txBody></p:sp>
                    </p:spTree>
                </p:cSld>
            </p:sld>""",
        )
        z.writestr(
            "ppt/slides/_rels/slide1.xml.rels",
            """<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                <Relationship Id="rIdNotes" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide1.xml"/>
            </Relationships>""",
        )
        z.writestr(
            "ppt/notesSlides/notesSlide1.xml",
            """<p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                <p:cSld>
                    <p:spTree>
                        <p:sp><p:txBody><a:p><a:r><a:t>Remember to emphasize prokaryotes vs eukaryotes.</a:t></a:r></a:p></p:txBody></p:sp>
                    </p:spTree>
                </p:cSld>
            </p:notes>""",
        )
        z.writestr(
            "ppt/slides/slide2.xml",
            """<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                <p:cSld>
                    <p:spTree>
                        <p:sp><p:txBody><a:p><a:r><a:t>Mitochondria: Powerhouse of the cell</a:t></a:r></a:p></p:txBody></p:sp>
                    </p:spTree>
                </p:cSld>
            </p:sld>""",
        )
    return buf.getvalue()


def _create_sample_docx() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(
            "word/document.xml",
            """<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <w:body>
                    <w:p><w:r><w:t>Chapter 1: The Nervous System</w:t></w:r></w:p>
                    <w:p><w:r><w:t>Neurons transmit electrical impulses across synapses.</w:t></w:r></w:p>
                    <w:tbl>
                        <w:tr>
                            <w:tc><w:p><w:r><w:t>Neurotransmitter</w:t></w:r></w:p></w:tc>
                            <w:tc><w:p><w:r><w:t>Function</w:t></w:r></w:p></w:tc>
                        </w:tr>
                        <w:tr>
                            <w:tc><w:p><w:r><w:t>Dopamine</w:t></w:r></w:p></w:tc>
                            <w:tc><w:p><w:r><w:t>Reward and motor control</w:t></w:r></w:p></w:tc>
                        </w:tr>
                    </w:tbl>
                </w:body>
            </w:document>""",
        )
    return buf.getvalue()


def _create_sample_epub() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("mimetype", "application/epub+zip")
        z.writestr(
            "META-INF/container.xml",
            '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
        )
        z.writestr(
            "content.opf",
            '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId"><metadata><title>Sample Book</title></metadata><manifest><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/></spine></package>',
        )
        z.writestr(
            "c1.xhtml",
            '<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Microeconomics</h1><p>Supply and demand curves intersect at market equilibrium.</p></body></html>',
        )
    return buf.getvalue()


class MultiFormatUploadTests(unittest.TestCase):
    def test_validate_upload_accepts_valid_formats(self):
        cases = [
            ("notes.pdf", "application/pdf", b"%PDF-1.4 test content"),
            (
                "slides.pptx",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                _create_sample_pptx(),
            ),
            (
                "doc.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _create_sample_docx(),
            ),
            ("book.epub", "application/epub+zip", _create_sample_epub()),
            ("summary.txt", "text/plain", b"Simple study notes for history."),
            ("guide.md", "text/markdown", b"# Markdown Study Guide\n\n- Key concept 1\n- Key concept 2"),
            ("data.csv", "text/csv", b"Term,Definition\nOhm,Unit of resistance\nVolt,Unit of potential"),
            ("doc.rtf", "application/rtf", b"{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times;}}\\f0\\fs20 Physics notes.\\par}"),
            ("web.html", "text/html", b"<html><body><h1>Organic Chemistry</h1><p>Alkanes and alkenes.</p></body></html>"),
        ]
        for filename, content_type, payload in cases:
            with self.subTest(filename=filename):
                upload = _make_upload_file(filename, content_type)
                validate_upload(upload, payload)

    def test_validate_upload_accepts_octet_stream_fallback(self):
        pptx_payload = _create_sample_pptx()
        upload = _make_upload_file("presentation.pptx", "application/octet-stream")
        validate_upload(upload, pptx_payload)

        md_payload = b"# Markdown Title\n\nNotes text."
        upload_md = _make_upload_file("notes.md", "application/octet-stream")
        validate_upload(upload_md, md_payload)

    def test_validate_upload_rejects_unsupported_extensions(self):
        cases = [
            ("malware.exe", "application/octet-stream", b"MZ\x90\x00"),
            ("legacy.doc", "application/msword", b"\xd0\xcf\x11\xe0"),
            ("script.py", "text/x-python", b"import os"),
        ]
        for filename, content_type, payload in cases:
            with self.subTest(filename=filename):
                upload = _make_upload_file(filename, content_type)
                with self.assertRaises(HTTPException) as ctx:
                    validate_upload(upload, payload)
                self.assertEqual(ctx.exception.status_code, 400)
                self.assertIn("Unsupported file format", ctx.exception.detail)

    def test_validate_upload_rejects_empty_file(self):
        upload = _make_upload_file("empty.pdf", "application/pdf")
        with self.assertRaises(HTTPException) as ctx:
            validate_upload(upload, b"")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("empty", ctx.exception.detail)

    def test_validate_upload_rejects_spoofed_pdf_magic(self):
        upload = _make_upload_file("spoofed.pdf", "application/pdf")
        with self.assertRaises(HTTPException) as ctx:
            validate_upload(upload, b"Not a real pdf at all")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("valid PDF", ctx.exception.detail)

    def test_validate_upload_rejects_spoofed_pptx_magic(self):
        upload = _make_upload_file(
            "spoofed.pptx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
        with self.assertRaises(HTTPException) as ctx:
            validate_upload(upload, b"Not a zip file")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("valid PPTX archive", ctx.exception.detail)

    def test_extract_pptx_pages_extracts_slides_and_notes(self):
        pptx_bytes = _create_sample_pptx()
        pages, slide_count = extract_pptx_pages(pptx_bytes)

        self.assertEqual(slide_count, 2)
        self.assertEqual(len(pages), 2)

        # Slide 1 contains title, subtitle, and speaker notes
        self.assertEqual(pages[0].page_number, 1)
        self.assertIn("Introduction to Cellular Biology", pages[0].text)
        self.assertIn("Speaker Notes: Remember to emphasize", pages[0].text)

        # Slide 2 contains mitochondria
        self.assertEqual(pages[1].page_number, 2)
        self.assertIn("Mitochondria", pages[1].text)

        # Slide citations mapping through chunk_pdf_pages
        chunks = chunk_pdf_pages(pages, chunk_size=2000, overlap=200)
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0].page_number, 1)
        self.assertEqual(chunks[1].page_number, 2)

    def test_extract_docx_text_extracts_paragraphs_and_tables(self):
        docx_bytes = _create_sample_docx()
        text, page_count = extract_docx_text(docx_bytes)

        self.assertIn("Chapter 1: The Nervous System", text)
        self.assertIn("Dopamine", text)
        self.assertIn("Reward and motor control", text)
        self.assertGreaterEqual(page_count, 1)

        chunks = chunk_docx_text(text)
        self.assertGreaterEqual(len(chunks), 1)
        self.assertIsNone(chunks[0].page_number)

    def test_extract_epub_pages_extracts_text_with_page_number(self):
        epub_bytes = _create_sample_epub()
        pages, page_count = extract_epub_pages(epub_bytes)

        self.assertGreaterEqual(page_count, 1)
        self.assertGreaterEqual(len(pages), 1)
        self.assertIn("Microeconomics", pages[0].text)
        self.assertIn("Supply and demand", pages[0].text)
        self.assertEqual(pages[0].page_number, 1)

    def test_extract_text_document_handles_csv(self):
        csv_bytes = b"Term,Definition\nPhotosynthesis,Plant light energy conversion\nMitosis,Cellular division"
        text, page_count = extract_text_document(csv_bytes, ".csv")

        self.assertIn("Term: Photosynthesis | Definition: Plant light energy conversion", text)
        self.assertIn("Term: Mitosis | Definition: Cellular division", text)
        self.assertEqual(page_count, 1)

    def test_extract_text_document_handles_html(self):
        html_bytes = b"<html><head><style>p { color: blue; }</style></head><body><h1>Photosynthesis</h1><p>Carbon fixation in chloroplasts.</p><script>alert('bad')</script></body></html>"
        text, page_count = extract_text_document(html_bytes, ".html")

        self.assertIn("Photosynthesis", text)
        self.assertIn("Carbon fixation", text)
        self.assertNotIn("alert", text)
        self.assertNotIn("color: blue", text)
        self.assertEqual(page_count, 1)

    def test_extract_text_document_handles_rtf(self):
        rtf_bytes = b"{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Courier;}}\\f0\\fs24 History of Science.\\par Isaac Newton published Principia.} "
        text, page_count = extract_text_document(rtf_bytes, ".rtf")

        self.assertIn("History of Science.", text)
        self.assertIn("Isaac Newton published Principia.", text)
        self.assertNotIn("fonttbl", text)
        self.assertNotIn("fs24", text)
        self.assertEqual(page_count, 1)

    def test_extract_text_document_handles_markdown_and_plain_text(self):
        md_bytes = "# Calculus Notes\n\nLimits define derivatives.\n\n- Integration is accumulation.".encode("utf-8")
        text, page_count = extract_text_document(md_bytes, ".md")

        self.assertIn("Calculus Notes", text)
        self.assertIn("Limits define derivatives", text)
        self.assertEqual(page_count, 1)


if __name__ == "__main__":
    unittest.main()
