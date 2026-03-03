from uuid import UUID

from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class WikiSpace(BaseModel, AuditMixin):
    __tablename__ = "wiki_spaces"
    __table_args__ = (
        UniqueConstraint("workspace_id", "slug", name="uq_wiki_spaces_workspace_slug"),
    )

    workspace_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("workspaces.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    workspace = relationship("Workspace")
    pages = relationship(
        "WikiPage", back_populates="space", cascade="all, delete-orphan"
    )


class WikiPage(BaseModel, AuditMixin):
    __tablename__ = "wiki_pages"
    __table_args__ = (
        UniqueConstraint("space_id", "slug", name="uq_wiki_pages_space_slug"),
        Index("ix_wiki_pages_search_vector", "search_vector", postgresql_using="gin"),
    )

    space_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("wiki_spaces.id"),
        nullable=False,
        index=True,
    )
    parent_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("wiki_pages.id"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    search_vector = Column(pg.TSVECTOR)

    space = relationship("WikiSpace", back_populates="pages")
    parent = relationship("WikiPage", remote_side="WikiPage.id", back_populates="children")
    children = relationship("WikiPage", back_populates="parent", cascade="all, delete-orphan")
    versions = relationship(
        "WikiPageVersion", back_populates="page", cascade="all, delete-orphan"
    )


class WikiPageVersion(BaseModel, TimestampMixin):
    __tablename__ = "wiki_page_versions"
    __table_args__ = (
        UniqueConstraint(
            "page_id", "version_number", name="uq_wiki_page_versions_page_version"
        ),
    )

    page_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("wiki_pages.id"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    edited_by: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    change_summary: Mapped[str | None] = mapped_column(String(500), nullable=True)

    page = relationship("WikiPage", back_populates="versions")


class WikiPageComment(BaseModel, TimestampMixin):
    __tablename__ = "wiki_page_comments"

    page_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("wiki_pages.id"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    parent_comment_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("wiki_page_comments.id"),
        nullable=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    page = relationship("WikiPage")
    author = relationship("User")
    parent_comment = relationship(
        "WikiPageComment", remote_side="WikiPageComment.id", back_populates="replies"
    )
    replies = relationship("WikiPageComment", back_populates="parent_comment")
