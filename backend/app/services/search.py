from uuid import UUID

from sqlalchemy import case, func, literal, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue import Issue
from app.models.issue_relation import IssueComment
from app.models.project import Project
from app.schemas.search_global import SearchParams, SearchResponse, SearchResultItem


class SearchService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def search(self, params: SearchParams) -> SearchResponse:
        allowed_types = self._resolve_types(params.types)

        sub_queries = []
        if "issues" in allowed_types:
            sub_queries.append(self._build_issue_query(params))
        if "projects" in allowed_types:
            sub_queries.append(self._build_project_query(params))
        if "comments" in allowed_types:
            sub_queries.append(self._build_comment_query(params))

        if not sub_queries:
            return SearchResponse(results=[], total_count=0, facets={})

        combined = union_all(*sub_queries).subquery("combined")

        # Total count across all types
        count_stmt = select(func.count()).select_from(combined)
        count_result = await self.session.execute(count_stmt)
        total_count: int = count_result.scalar_one()

        # Facets: count per entity_type
        facet_stmt = (
            select(combined.c.entity_type, func.count().label("cnt"))
            .select_from(combined)
            .group_by(combined.c.entity_type)
        )
        facet_result = await self.session.execute(facet_stmt)
        facets: dict[str, int] = {
            row.entity_type: row.cnt for row in facet_result.all()
        }

        # Paginated results sorted by relevance descending
        results_stmt = (
            select(combined)
            .order_by(combined.c.relevance.desc().nulls_last())
            .limit(params.limit)
            .offset(params.offset)
        )
        results_result = await self.session.execute(results_stmt)
        rows = results_result.all()

        items = [
            SearchResultItem(
                entity_type=row.entity_type,
                entity_id=row.entity_id,
                title=row.title,
                subtitle=row.subtitle,
                project_id=row.project_id,
                project_name=row.project_name,
                relevance=row.relevance,
                highlight=row.highlight,
            )
            for row in rows
        ]

        return SearchResponse(
            results=items,
            total_count=total_count,
            facets=facets,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_types(types: list[str] | None) -> set[str]:
        valid = {"issues", "projects", "comments"}
        if not types:
            return valid
        return valid & {t.strip().lower() for t in types}

    @staticmethod
    def _build_issue_query(params: SearchParams):
        ts_query = func.plainto_tsquery("english", params.query)
        rank = func.ts_rank(Issue.search_vector, ts_query)
        headline = func.ts_headline(
            "english",
            func.coalesce(Issue.summary, literal("")),
            ts_query,
            literal("StartSel=<mark>, StopSel=</mark>, MaxFragments=1"),
        )

        stmt = (
            select(
                literal("issues").label("entity_type"),
                Issue.id.label("entity_id"),
                Issue.summary.label("title"),
                Issue.issue_key.label("subtitle"),
                Issue.project_id.label("project_id"),
                Project.name.label("project_name"),
                rank.label("relevance"),
                headline.label("highlight"),
            )
            .join(Project, Project.id == Issue.project_id)
            .where(Issue.search_vector.op("@@")(ts_query))
            .where(Issue.is_deleted.is_(False))
        )

        if params.project_id is not None:
            stmt = stmt.where(Issue.project_id == params.project_id)
        if params.workspace_id is not None:
            stmt = stmt.where(Project.workspace_id == params.workspace_id)

        return stmt

    @staticmethod
    def _build_project_query(params: SearchParams):
        pattern = func.concat("%", params.query, "%")
        # Name matches score higher than description-only matches
        relevance = case(
            (Project.name.ilike(pattern), literal(0.8)),
            else_=literal(0.4),
        )

        stmt = (
            select(
                literal("projects").label("entity_type"),
                Project.id.label("entity_id"),
                Project.name.label("title"),
                Project.key_prefix.label("subtitle"),
                Project.id.label("project_id"),
                Project.name.label("project_name"),
                relevance.label("relevance"),
                literal(None).label("highlight"),
            )
            .where(
                (Project.name.ilike(pattern)) | (Project.description.ilike(pattern))
            )
            .where(Project.is_deleted.is_(False))
        )

        if params.project_id is not None:
            stmt = stmt.where(Project.id == params.project_id)
        if params.workspace_id is not None:
            stmt = stmt.where(Project.workspace_id == params.workspace_id)

        return stmt

    @staticmethod
    def _build_comment_query(params: SearchParams):
        pattern = func.concat("%", params.query, "%")

        stmt = (
            select(
                literal("comments").label("entity_type"),
                IssueComment.id.label("entity_id"),
                func.left(IssueComment.content, 120).label("title"),
                Issue.issue_key.label("subtitle"),
                Issue.project_id.label("project_id"),
                Project.name.label("project_name"),
                literal(0.5).label("relevance"),
                literal(None).label("highlight"),
            )
            .join(Issue, Issue.id == IssueComment.issue_id)
            .join(Project, Project.id == Issue.project_id)
            .where(IssueComment.content.ilike(pattern))
            .where(IssueComment.is_deleted.is_(False))
            .where(Issue.is_deleted.is_(False))
        )

        if params.project_id is not None:
            stmt = stmt.where(Issue.project_id == params.project_id)
        if params.workspace_id is not None:
            stmt = stmt.where(Project.workspace_id == params.workspace_id)

        return stmt
