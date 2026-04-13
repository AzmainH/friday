from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.nl_project import (
    ApplyPlanRequest,
    BaselineLockRequest,
    BaselineLockResponse,
    PlanRefinementRequest,
    ProjectPlanRequest,
    ProjectPlanResponse,
)
from app.services.nl_project_generator import NLProjectGeneratorService

router = APIRouter(prefix="/projects", tags=["nl-project"])


@router.post(
    "/generate",
    response_model=ProjectPlanResponse,
)
async def generate_plan(
    body: ProjectPlanRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Generate a structured project plan from a natural language description.

    Uses AI to analyze the description and produce deliverables, tasks,
    roles, and timeline. Falls back to a sample plan when AI is unavailable.
    """
    service = NLProjectGeneratorService(session)
    # Use a default workspace_id derived from the user context
    # In production this would come from the request or user session
    plan = await service.generate_plan(
        description=body.description,
        workspace_id=user_id,  # placeholder workspace
    )
    return ProjectPlanResponse(**plan)


@router.post(
    "/{project_id}/refine",
    response_model=ProjectPlanResponse,
)
async def refine_plan(
    project_id: UUID,
    body: PlanRefinementRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Refine an existing project plan with natural language corrections.

    Takes the current plan and user feedback, then returns an updated plan.
    """
    service = NLProjectGeneratorService(session)
    # The plan_id from the body is used for tracking; the actual plan
    # would be provided by the client in a real implementation.
    # For now we generate a fresh plan and apply corrections.
    base_plan = await service.generate_plan(
        description=f"Refinement for project {project_id}",
        workspace_id=user_id,
    )
    refined = await service.refine_plan(base_plan, body.corrections)
    return ProjectPlanResponse(**refined)


@router.post(
    "/{project_id}/lock-baseline",
    response_model=BaselineLockResponse,
    status_code=201,
)
async def lock_baseline(
    project_id: UUID,
    body: BaselineLockRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Lock a baseline snapshot for all current issues in the project.

    Creates a Baseline record and snapshots every issue's current state
    for future variance tracking.
    """
    service = NLProjectGeneratorService(session)
    result = await service.lock_baseline(project_id, body.name, user_id)
    return BaselineLockResponse(
        baseline_id=result["baseline_id"],
        snapshot_count=result["snapshot_count"],
    )


@router.post(
    "/generate/apply",
)
async def apply_plan(
    body: ApplyPlanRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Materialize a generated plan into real project entities.

    Creates a Project and Issues from the plan structure. Returns
    the created project ID and count of issues created.
    """
    service = NLProjectGeneratorService(session)
    result = await service.apply_plan(
        plan=body.plan.model_dump(),
        workspace_id=body.workspace_id,
        project_name=body.project_name,
        user_id=user_id,
    )
    return result
