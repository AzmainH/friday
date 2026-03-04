"""Pydantic schemas for Earned Value Management endpoints."""

from pydantic import BaseModel, ConfigDict


class EVMResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: str
    bac: float
    pv: float
    ev: float
    ac: float
    sv: float
    cv: float
    spi: float
    cpi: float
    eac: float
    etc: float
    vac: float
    tcpi: float
    percent_complete: float
    planned_percent: float
    total_issues: int
    done_issues: int
    total_milestones: int
    completed_milestones: int
