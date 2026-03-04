from __future__ import annotations

import pytest
from datetime import date
from httpx import AsyncClient

from app.services.document_parser.docx_parser import DocxParser
from app.services.document_parser.xlsx_parser import XlsxParser
from app.services.document_parser.models import (
    ParsedProjectSpec,
    ParsedResource,
    ParsedTask,
    ParsedMilestone,
    ResourceMatch,
)
from app.tasks.document_import import (
    _default_status_category,
    _generate_key_prefix,
    _get_parent_wbs,
    _parse_duration_hours,
    _serialize_date,
)


# ---------------------------------------------------------------------------
# Pure helper tests
# ---------------------------------------------------------------------------


class TestGetParentWbs:
    def test_top_level(self):
        assert _get_parent_wbs("1") is None

    def test_two_levels(self):
        assert _get_parent_wbs("1.1") == "1"

    def test_three_levels(self):
        assert _get_parent_wbs("1.1.1") == "1.1"

    def test_four_levels(self):
        assert _get_parent_wbs("2.3.4.5") == "2.3.4"


class TestParseDurationHours:
    def test_days(self):
        assert _parse_duration_hours("5 days") == 40.0

    def test_single_day(self):
        assert _parse_duration_hours("1 day") == 8.0

    def test_hours(self):
        assert _parse_duration_hours("4 hours") == 4.0

    def test_weeks(self):
        assert _parse_duration_hours("2 weeks") == 80.0

    def test_none_input(self):
        assert _parse_duration_hours(None) is None

    def test_empty_string(self):
        assert _parse_duration_hours("") is None

    def test_unparseable(self):
        assert _parse_duration_hours("some random text") is None

    def test_fractional_days(self):
        assert _parse_duration_hours("2.5 days") == 20.0


class TestDefaultStatusCategory:
    def test_complete(self):
        assert _default_status_category("Complete") == "done"

    def test_in_progress(self):
        assert _default_status_category("In Progress") == "in_progress"

    def test_planned(self):
        assert _default_status_category("Planned") == "to_do"

    def test_blocked(self):
        assert _default_status_category("Blocked") == "blocked"

    def test_in_review(self):
        assert _default_status_category("In Review") == "in_review"

    def test_unknown_falls_back(self):
        assert _default_status_category("Something Unknown") == "to_do"

    def test_case_insensitive(self):
        assert _default_status_category("COMPLETE") == "done"
        assert _default_status_category("in progress") == "in_progress"

    def test_whitespace_stripped(self):
        assert _default_status_category("  Done  ") == "done"


class TestSerializeDate:
    def test_none(self):
        assert _serialize_date(None) is None

    def test_date(self):
        assert _serialize_date(date(2025, 6, 15)) == "2025-06-15"


class TestGenerateKeyPrefix:
    def test_multi_word(self):
        result = _generate_key_prefix("Build in Five")
        assert result == "BIF"

    def test_single_word(self):
        result = _generate_key_prefix("Project")
        assert result == "P"

    def test_two_word(self):
        result = _generate_key_prefix("My Project")
        assert result == "MP"

    def test_empty(self):
        result = _generate_key_prefix("")
        assert result == "IMP"


# ---------------------------------------------------------------------------
# Parser model tests
# ---------------------------------------------------------------------------


class TestParsedModels:
    def test_parsed_task_hierarchy_level(self):
        task = ParsedTask(wbs="1.2.3", name="Test Task", status="Planned")
        assert task.hierarchy_level == 3

    def test_parsed_task_single_level(self):
        task = ParsedTask(wbs="1", name="Phase 1", status="Active")
        assert task.hierarchy_level == 1

    def test_parsed_project_spec_defaults(self):
        spec = ParsedProjectSpec(name="Test Project")
        assert spec.tasks == []
        assert spec.milestones == []
        assert spec.resources == []
        assert spec.phases == []
        assert spec.statuses == []

    def test_resource_match(self):
        match = ResourceMatch(
            document_name="John Doe",
            matched_user_id=None,
            matched_display_name=None,
            confidence=0.0,
        )
        assert match.confidence == 0.0
        assert match.matched_user_id is None

    def test_parsed_resource(self):
        resource = ParsedResource(name="Jane Smith", role="Developer")
        assert resource.name == "Jane Smith"
        assert resource.allocation_pct is None


# ---------------------------------------------------------------------------
# DocxParser unit tests (without real files)
# ---------------------------------------------------------------------------


class TestDocxParser:
    def test_instantiation(self):
        parser = DocxParser()
        assert parser is not None


class TestXlsxParser:
    def test_instantiation(self):
        parser = XlsxParser()
        assert parser is not None


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_analyze_no_files(client: AsyncClient):
    """POST /document-import/analyze with no files should return 422."""
    response = await client.post("/api/v1/document-import/analyze")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_analysis_nonexistent(client: AsyncClient):
    """GET /document-import/analysis/{bad_id} should return 404."""
    fake_id = "00000000-0000-0000-0000-000000000099"
    response = await client.get(f"/api/v1/document-import/analysis/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_task_status_nonexistent(client: AsyncClient):
    """GET /document-import/tasks/{bad_id} should return 404."""
    fake_id = "00000000-0000-0000-0000-000000000099"
    response = await client.get(f"/api/v1/document-import/tasks/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_missing_analysis(client: AsyncClient):
    """POST /document-import/create with bad analysis_task_id should 404."""
    fake_id = "00000000-0000-0000-0000-000000000099"
    response = await client.post(
        "/api/v1/document-import/create",
        json={
            "analysis_task_id": fake_id,
            "mode": "new",
            "project_name": "Test",
            "resource_mapping": {},
            "status_mapping": {},
            "create_milestones": True,
        },
    )
    assert response.status_code == 404
