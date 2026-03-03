from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OrgBase(BaseModel):
    name: str
    slug: str
    logo_url: str | None = None
    settings: dict | None = None


class OrgCreate(OrgBase):
    pass


class OrgUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    logo_url: str | None = None
    settings: dict | None = None


class OrgResponse(OrgBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
