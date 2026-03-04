from __future__ import annotations

import json
from datetime import date
from typing import Any

import structlog

from app.core.config import settings
from app.services.document_parser.models import (
    ParsedMilestone,
    ParsedProjectSpec,
    ParsedResource,
    ParsedTask,
)

logger = structlog.get_logger(__name__)

# -----------------------------------------------------------------------
# JSON schema description embedded in the LLM prompt so the model knows
# exactly what structure to return.
# -----------------------------------------------------------------------
_SCHEMA_DESCRIPTION = """\
Return a single JSON object with the following top-level keys:

{
  "name": "string or null — project name",
  "description": "string or null — short project description",
  "key_prefix": "string or null — suggested short prefix for issue keys (2-5 uppercase chars)",
  "start_date": "YYYY-MM-DD or null",
  "target_end_date": "YYYY-MM-DD or null",
  "phases": ["list of phase name strings"],
  "tasks": [
    {
      "wbs": "string or null — WBS code like 1.2.3",
      "name": "string — task name",
      "status": "string or null",
      "duration": "string or null — e.g. '5d', '2w'",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "resource_names": ["list of resource name strings assigned to this task"],
      "predecessors": ["list of WBS codes or task names this task depends on"],
      "deliverable_ref": "string or null — reference to a deliverable",
      "notes": "string or null"
    }
  ],
  "milestones": [
    {
      "name": "string",
      "milestone_type": "string or null — e.g. 'phase_gate', 'deliverable', 'external'",
      "start_date": "YYYY-MM-DD or null",
      "due_date": "YYYY-MM-DD or null",
      "description": "string or null"
    }
  ],
  "resources": [
    {
      "name": "string — person's full name",
      "role": "string or null — their role/title",
      "allocation_pct": "number or null — 0-100"
    }
  ],
  "statuses": ["list of distinct status strings found in the plan"],
  "risks": ["list of risk description strings"],
  "metrics": ["list of KPI / metric strings"],
  "raw_summary": "string — a brief narrative summary of the project"
}

Rules:
- Use null for missing or unknown values, never empty strings.
- Dates must be in YYYY-MM-DD format.
- Do NOT invent data that is not present in the source documents.
- Combine information from ALL provided documents into a single unified project spec.
- If a task has zero-duration and looks like a milestone, include it in BOTH tasks and milestones.
"""

_SYSTEM_PROMPT = (
    "You are a project-management document analyst. "
    "You receive the extracted text content of one or more project documents "
    "(DOCX programme overviews and/or XLSX project plans). "
    "Your job is to extract structured project data and return it as a single JSON object.\n\n"
    f"{_SCHEMA_DESCRIPTION}"
)


class AIDocumentParser:
    """Send extracted document text to an LLM for structured JSON extraction.

    Falls back to deterministic XLSX-row parsing when no OpenAI API key is
    configured so that the system remains functional in offline / dev
    environments.
    """

    def __init__(self) -> None:
        self._api_key: str = settings.OPENAI_API_KEY

    async def parse_documents(
        self,
        extracted_texts: list[dict[str, str]],
    ) -> ParsedProjectSpec:
        """Parse extracted document texts into a structured project spec.

        Args:
            extracted_texts: List of dicts, each with keys ``file_name``,
                ``file_type`` (``"docx"`` or ``"xlsx"``), and ``content``
                (the text extracted by the relevant parser).

        Returns:
            A fully-populated ``ParsedProjectSpec``.
        """
        if self._api_key:
            return await self._parse_via_llm(extracted_texts)

        logger.warning(
            "ai_parser.no_api_key",
            msg="OPENAI_API_KEY not set — falling back to deterministic parsing",
        )
        return self._parse_deterministic(extracted_texts)

    # ------------------------------------------------------------------
    # LLM-based parsing
    # ------------------------------------------------------------------

    async def _parse_via_llm(
        self,
        extracted_texts: list[dict[str, str]],
    ) -> ParsedProjectSpec:
        """Call OpenAI GPT-4o-mini with JSON mode to extract project data."""
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=self._api_key)

        user_message = self._build_user_message(extracted_texts)

        logger.info(
            "ai_parser.llm_request",
            file_count=len(extracted_texts),
            prompt_length=len(user_message),
        )

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            max_tokens=4096,
        )

        raw_json = response.choices[0].message.content or "{}"
        logger.info(
            "ai_parser.llm_response",
            response_length=len(raw_json),
            usage_prompt=getattr(response.usage, "prompt_tokens", None),
            usage_completion=getattr(response.usage, "completion_tokens", None),
        )

        return self._json_to_spec(raw_json)

    @staticmethod
    def _build_user_message(extracted_texts: list[dict[str, str]]) -> str:
        """Assemble the user-role message from all extracted document texts."""
        parts: list[str] = [
            "Below are the extracted contents of the project documents. "
            "Analyse them and return the structured JSON.\n"
        ]
        for idx, doc in enumerate(extracted_texts, start=1):
            parts.append(
                f"--- Document {idx}: {doc['file_name']} "
                f"(type: {doc['file_type']}) ---\n"
                f"{doc['content']}\n"
            )
        return "\n".join(parts)

    # ------------------------------------------------------------------
    # JSON -> ParsedProjectSpec
    # ------------------------------------------------------------------

    def _json_to_spec(self, raw_json: str) -> ParsedProjectSpec:
        """Parse raw JSON string from the LLM into a ``ParsedProjectSpec``."""
        try:
            data: dict[str, Any] = json.loads(raw_json)
        except json.JSONDecodeError:
            logger.error("ai_parser.json_decode_error", raw=raw_json[:500])
            return ParsedProjectSpec(raw_summary="Failed to parse LLM response as JSON.")

        return ParsedProjectSpec(
            name=data.get("name"),
            description=data.get("description"),
            key_prefix=data.get("key_prefix"),
            start_date=self._parse_date(data.get("start_date")),
            target_end_date=self._parse_date(data.get("target_end_date")),
            phases=data.get("phases") or [],
            tasks=[
                ParsedTask(
                    wbs=t.get("wbs"),
                    name=t.get("name", "Untitled Task"),
                    status=t.get("status"),
                    duration=t.get("duration"),
                    start_date=self._parse_date(t.get("start_date")),
                    end_date=self._parse_date(t.get("end_date")),
                    resource_names=t.get("resource_names") or [],
                    predecessors=t.get("predecessors") or [],
                    deliverable_ref=t.get("deliverable_ref"),
                    notes=t.get("notes"),
                )
                for t in (data.get("tasks") or [])
            ],
            milestones=[
                ParsedMilestone(
                    name=m.get("name", "Untitled Milestone"),
                    milestone_type=m.get("milestone_type"),
                    start_date=self._parse_date(m.get("start_date")),
                    due_date=self._parse_date(m.get("due_date")),
                    description=m.get("description"),
                )
                for m in (data.get("milestones") or [])
            ],
            resources=[
                ParsedResource(
                    name=r.get("name", "Unknown"),
                    role=r.get("role"),
                    allocation_pct=self._parse_float(r.get("allocation_pct")),
                )
                for r in (data.get("resources") or [])
            ],
            statuses=data.get("statuses") or [],
            risks=data.get("risks") or [],
            metrics=data.get("metrics") or [],
            raw_summary=data.get("raw_summary"),
        )

    # ------------------------------------------------------------------
    # Deterministic fallback (no LLM)
    # ------------------------------------------------------------------

    def _parse_deterministic(
        self,
        extracted_texts: list[dict[str, str]],
    ) -> ParsedProjectSpec:
        """Best-effort deterministic parsing when no API key is available.

        This inspects XLSX content for common column header patterns
        (WBS, Task Name, Start, Finish, etc.) and extracts rows into
        ``ParsedTask`` objects.  DOCX content is captured as the
        ``raw_summary``.
        """
        tasks: list[ParsedTask] = []
        resources: list[ParsedResource] = []
        resource_name_set: set[str] = set()
        raw_summaries: list[str] = []
        project_name: str | None = None
        statuses: set[str] = set()

        for doc in extracted_texts:
            if doc["file_type"] == "docx":
                raw_summaries.append(doc["content"][:2000])
                # Try to extract project name from the first heading.
                if project_name is None:
                    project_name = self._extract_heading(doc["content"])
            elif doc["file_type"] == "xlsx":
                parsed = self._parse_xlsx_text(doc["content"])
                tasks.extend(parsed["tasks"])
                statuses.update(parsed["statuses"])
                for name in parsed["resource_names"]:
                    if name not in resource_name_set:
                        resource_name_set.add(name)
                        resources.append(ParsedResource(name=name))

        return ParsedProjectSpec(
            name=project_name,
            tasks=tasks,
            resources=resources,
            statuses=sorted(statuses),
            raw_summary="\n---\n".join(raw_summaries) if raw_summaries else None,
        )

    @staticmethod
    def _extract_heading(content: str) -> str | None:
        """Pull the first Markdown heading from extracted DOCX text."""
        for line in content.splitlines():
            stripped = line.strip()
            if stripped.startswith("#"):
                return stripped.lstrip("#").strip() or None
        return None

    def _parse_xlsx_text(self, content: str) -> dict[str, Any]:
        """Parse the pipe-separated table text emitted by ``XlsxParser``.

        Returns a dict with keys ``tasks``, ``resource_names``, and
        ``statuses``.
        """
        tasks: list[ParsedTask] = []
        resource_names: list[str] = []
        statuses: set[str] = set()

        current_headers: list[str] = []

        for line in content.splitlines():
            line = line.strip()
            if not line.startswith("|"):
                # Reset headers on non-table lines (e.g. sheet headings).
                current_headers = []
                continue

            cells = [c.strip() for c in line.strip("|").split("|")]

            # Skip separator rows.
            if all(c.replace("-", "") == "" for c in cells):
                continue

            # Detect header row — contains recognisable column names.
            if not current_headers and self._looks_like_header(cells):
                current_headers = [h.lower() for h in cells]
                continue

            if not current_headers:
                continue

            row = dict(zip(current_headers, cells, strict=False))
            task = self._row_to_task(row)
            if task:
                tasks.append(task)
                if task.status:
                    statuses.add(task.status)
                resource_names.extend(task.resource_names)

        return {
            "tasks": tasks,
            "resource_names": resource_names,
            "statuses": statuses,
        }

    @staticmethod
    def _looks_like_header(cells: list[str]) -> bool:
        """Heuristic: does this row look like a table header?"""
        header_keywords = {
            "wbs",
            "task",
            "name",
            "activity",
            "start",
            "finish",
            "end",
            "duration",
            "resource",
            "status",
            "predecessor",
            "owner",
            "assigned",
            "deliverable",
            "milestone",
            "phase",
        }
        lower_cells = {c.lower() for c in cells if c}
        return bool(lower_cells & header_keywords)

    def _row_to_task(self, row: dict[str, str]) -> ParsedTask | None:
        """Convert a single header-keyed row dict to a ``ParsedTask``."""
        name = (
            row.get("task name")
            or row.get("task")
            or row.get("name")
            or row.get("activity")
            or row.get("activity name")
        )
        if not name or not name.strip():
            return None

        resource_str = (
            row.get("resource")
            or row.get("resources")
            or row.get("resource names")
            or row.get("assigned to")
            or row.get("assigned")
            or row.get("owner")
            or ""
        )
        resource_names = [r.strip() for r in resource_str.replace(";", ",").split(",") if r.strip()]

        predecessor_str = (
            row.get("predecessors") or row.get("predecessor") or row.get("dependencies") or ""
        )
        predecessors = [
            p.strip() for p in predecessor_str.replace(";", ",").split(",") if p.strip()
        ]

        return ParsedTask(
            wbs=row.get("wbs") or row.get("wbs code") or None,
            name=name.strip(),
            status=row.get("status") or None,
            duration=row.get("duration") or None,
            start_date=self._parse_date(
                row.get("start") or row.get("start date") or row.get("start_date")
            ),
            end_date=self._parse_date(
                row.get("finish")
                or row.get("end")
                or row.get("end date")
                or row.get("end_date")
                or row.get("finish date")
            ),
            resource_names=resource_names,
            predecessors=predecessors,
            deliverable_ref=row.get("deliverable") or row.get("deliverable_ref") or None,
            notes=row.get("notes") or row.get("comments") or None,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_date(value: Any) -> date | None:
        """Best-effort date parsing from various string formats."""
        if value is None:
            return None
        if isinstance(value, date):
            return value
        if not isinstance(value, str):
            value = str(value)
        value = value.strip()
        if not value:
            return None

        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%d %b %Y", "%b %d, %Y"):
            try:
                from datetime import datetime as _dt

                return _dt.strptime(value, fmt).date()
            except ValueError:
                continue
        return None

    @staticmethod
    def _parse_float(value: Any) -> float | None:
        """Safely convert a value to float, returning ``None`` on failure."""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
