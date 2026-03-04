from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, computed_field

if TYPE_CHECKING:
    from datetime import date
    from uuid import UUID


class ParsedResource(BaseModel):
    """A resource (person) extracted from the project document."""

    model_config = ConfigDict(from_attributes=True)

    name: str
    role: str | None = None
    allocation_pct: float | None = None
    matched_user_id: UUID | None = None


class ParsedTask(BaseModel):
    """A task/work-package extracted from the project plan."""

    model_config = ConfigDict(from_attributes=True)

    wbs: str | None = None
    name: str
    status: str | None = None
    duration: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    resource_names: list[str] = Field(default_factory=list)
    predecessors: list[str] = Field(default_factory=list)
    deliverable_ref: str | None = None
    notes: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def hierarchy_level(self) -> int:
        """Compute hierarchy depth from the WBS code.

        Examples:
            "1"       -> 1
            "1.2"     -> 2
            "1.2.3"   -> 3
            None      -> 0
        """
        if not self.wbs:
            return 0
        return len(self.wbs.split("."))


class ParsedMilestone(BaseModel):
    """A milestone extracted from the project document."""

    model_config = ConfigDict(from_attributes=True)

    name: str
    milestone_type: str | None = None
    start_date: date | None = None
    due_date: date | None = None
    description: str | None = None


class ParsedProjectSpec(BaseModel):
    """Top-level container for all data extracted from project documents."""

    model_config = ConfigDict(from_attributes=True)

    name: str | None = None
    description: str | None = None
    key_prefix: str | None = None
    start_date: date | None = None
    target_end_date: date | None = None
    phases: list[str] = Field(default_factory=list)
    tasks: list[ParsedTask] = Field(default_factory=list)
    milestones: list[ParsedMilestone] = Field(default_factory=list)
    resources: list[ParsedResource] = Field(default_factory=list)
    statuses: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    metrics: list[str] = Field(default_factory=list)
    raw_summary: str | None = None


class ResourceMatch(BaseModel):
    """Result of fuzzy-matching a document resource name to a system User."""

    model_config = ConfigDict(from_attributes=True)

    document_name: str
    matched_user_id: UUID | None = None
    matched_display_name: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
