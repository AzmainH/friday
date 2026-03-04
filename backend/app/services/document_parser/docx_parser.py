from __future__ import annotations

import structlog
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

logger = structlog.get_logger(__name__)

# Mapping of Word heading styles to Markdown heading levels.
_HEADING_MAP: dict[str, str] = {
    "Heading 1": "##",
    "Heading 2": "###",
    "Heading 3": "####",
    "Heading 4": "#####",
    "Title": "#",
}


class DocxParser:
    """Extract structured text content from DOCX files.

    Walks all paragraphs and tables in document order, converting
    headings to Markdown-style markers and tables to pipe-separated
    rows so that downstream LLM parsing can leverage the structure.
    """

    def extract_content(self, file_path: str) -> str:
        """Open a DOCX file and return its content as structured text.

        Args:
            file_path: Absolute path to the .docx file on disk.

        Returns:
            A string containing the full document text with Markdown-style
            heading markers and pipe-separated table rows.
        """
        logger.info("docx_parser.extract_start", file_path=file_path)

        doc = Document(file_path)
        sections: list[str] = []

        for element in doc.element.body:
            tag = element.tag.split("}")[-1] if "}" in element.tag else element.tag

            if tag == "p":
                paragraph = Paragraph(element, doc)
                text = self._format_paragraph(paragraph)
                if text:
                    sections.append(text)

            elif tag == "tbl":
                table = Table(element, doc)
                table_text = self._format_table(table)
                if table_text:
                    sections.append(table_text)

        content = "\n".join(sections)
        logger.info(
            "docx_parser.extract_complete",
            file_path=file_path,
            content_length=len(content),
        )
        return content

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _format_paragraph(self, paragraph: Paragraph) -> str:
        """Convert a paragraph element to a text line.

        Headings are prefixed with Markdown-style ``#`` markers; normal
        paragraphs are returned as-is (stripped of leading/trailing
        whitespace).  Empty paragraphs are returned as empty strings.
        """
        text = paragraph.text.strip()
        if not text:
            return ""

        style_name = paragraph.style.name if paragraph.style else ""
        prefix = _HEADING_MAP.get(style_name, "")
        if prefix:
            return f"{prefix} {text}"
        return text

    def _format_table(self, table: Table) -> str:
        """Convert a Word table to Markdown-style pipe-separated rows.

        Returns a block like::

            | Col A | Col B | Col C |
            | ----- | ----- | ----- |
            | val1  | val2  | val3  |
        """
        rows: list[str] = []

        for row_idx, row in enumerate(table.rows):
            cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
            line = "| " + " | ".join(cells) + " |"
            rows.append(line)

            # Insert a separator row after the first (header) row.
            if row_idx == 0:
                separator = "| " + " | ".join("---" for _ in cells) + " |"
                rows.append(separator)

        return "\n".join(rows)
