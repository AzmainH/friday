from collections import defaultdict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.raci import RACIAssignment, RACIRoleType
from app.repositories.raci import RACIRepository
from app.schemas.raci import RACIMatrixResponse, RACIMatrixRow


class RACIService:
    def __init__(self, session: AsyncSession):
        self.repo = RACIRepository(session)
        self.session = session

    async def get_matrix(self, project_id: UUID) -> RACIMatrixResponse:
        assignments = await self.repo.get_matrix(project_id)
        grouped: dict[UUID | None, dict[str, list[UUID]]] = defaultdict(
            lambda: {
                "responsible": [],
                "accountable": [],
                "consulted": [],
                "informed": [],
            }
        )
        issue_meta: dict[UUID | None, dict] = {}
        for a in assignments:
            key = a.issue_id
            grouped[key][a.role_type.value if hasattr(a.role_type, "value") else a.role_type].append(a.user_id)
            if key not in issue_meta:
                issue_meta[key] = {"issue_key": None, "summary": None}

        rows = []
        for issue_id, roles in grouped.items():
            meta = issue_meta.get(issue_id, {})
            rows.append(
                RACIMatrixRow(
                    issue_id=issue_id,
                    issue_key=meta.get("issue_key"),
                    summary=meta.get("summary"),
                    responsible=roles["responsible"],
                    accountable=roles["accountable"],
                    consulted=roles["consulted"],
                    informed=roles["informed"],
                )
            )
        return RACIMatrixResponse(rows=rows)

    async def set_assignment(
        self, project_id: UUID, data: dict, user_id: UUID | None = None
    ) -> RACIAssignment:
        role_type_str = data.get("role_type", "")
        try:
            RACIRoleType(role_type_str)
        except ValueError:
            raise ConflictException(
                f"Invalid role_type: {role_type_str}. "
                f"Must be one of: responsible, accountable, consulted, informed"
            )
        data["project_id"] = project_id
        return await self.repo.upsert(data)

    async def bulk_update(
        self, project_id: UUID, assignments: list[dict]
    ) -> list[RACIAssignment]:
        for a in assignments:
            role_type_str = a.get("role_type", "")
            try:
                RACIRoleType(role_type_str)
            except ValueError:
                raise ConflictException(
                    f"Invalid role_type: {role_type_str}. "
                    f"Must be one of: responsible, accountable, consulted, informed"
                )

        await self.repo.delete_all_for_project(project_id)

        created = []
        for a in assignments:
            a["project_id"] = project_id
            obj = await self.repo.create(a)
            created.append(obj)
        return created

    async def delete_assignment(self, assignment_id: UUID) -> bool:
        deleted = await self.repo.delete_assignment(assignment_id)
        if not deleted:
            raise NotFoundException("RACI assignment not found")
        return True
