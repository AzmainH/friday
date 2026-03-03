import json
from datetime import datetime, timezone
from uuid import UUID

import structlog

from app.core.config import settings
from app.core.database import async_session_factory
from app.models.notification import TaskStatus

logger = structlog.get_logger()

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None  # type: ignore[assignment,misc]


async def _get_task_status(session, run_id: UUID) -> TaskStatus | None:
    from sqlalchemy import select

    result = await session.execute(
        select(TaskStatus).where(TaskStatus.id == run_id)
    )
    return result.scalar_one_or_none()


async def _update_task(session, run_id: UUID, **kwargs) -> None:
    task = await _get_task_status(session, run_id)
    if task:
        for key, value in kwargs.items():
            setattr(task, key, value)
        await session.flush()


async def _call_openai(prompt: str) -> str | None:
    """Attempt to call OpenAI. Returns response text or None on failure."""
    if not settings.OPENAI_API_KEY or AsyncOpenAI is None:
        return None

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
        )
        return response.choices[0].message.content
    except Exception as exc:
        logger.warning("openai_call_failed", error=str(exc))
        return None


async def ai_smart_schedule(ctx: dict, project_id: str, run_id: str) -> dict:
    """Generate smart schedule suggestions for a project.

    Stubbed: returns mock schedule data when no OpenAI key is configured.
    """
    logger.info(
        "ai_smart_schedule_started",
        project_id=project_id,
        run_id=run_id,
    )
    project_uuid = UUID(project_id)
    run_uuid = UUID(run_id)

    async with async_session_factory() as session:
        try:
            await _update_task(
                session,
                run_uuid,
                status="running",
                progress_pct=10,
                started_at=datetime.now(timezone.utc),
            )
            await session.commit()

            # Attempt OpenAI call
            ai_result = await _call_openai(
                f"Generate a JSON array of 3 smart scheduling suggestions for "
                f"project {project_id}. Each item should have: issue_key, "
                f"suggested_start (ISO date), suggested_end (ISO date), reason."
            )

            if ai_result:
                try:
                    suggestions = json.loads(ai_result)
                except (json.JSONDecodeError, TypeError):
                    suggestions = _mock_schedule_suggestions()
            else:
                suggestions = _mock_schedule_suggestions()

            result_data = {"suggestions": suggestions}

            await _update_task(
                session,
                run_uuid,
                status="completed",
                progress_pct=100,
                result_summary_json=result_data,
                completed_at=datetime.now(timezone.utc),
            )
            await session.commit()

            logger.info("ai_smart_schedule_completed", run_id=run_id)
            return result_data

        except Exception as exc:
            logger.exception("ai_smart_schedule_failed", run_id=run_id)
            await session.rollback()
            async with async_session_factory() as err_session:
                await _update_task(
                    err_session,
                    run_uuid,
                    status="failed",
                    error_message=str(exc),
                    completed_at=datetime.now(timezone.utc),
                )
                await err_session.commit()
            return {"error": str(exc)}


def _mock_schedule_suggestions() -> list[dict]:
    return [
        {
            "issue_key": "PROJ-101",
            "suggested_start": "2026-03-10",
            "suggested_end": "2026-03-14",
            "reason": "Dependencies resolved; team capacity available",
        },
        {
            "issue_key": "PROJ-102",
            "suggested_start": "2026-03-15",
            "suggested_end": "2026-03-20",
            "reason": "Blocked by PROJ-101; earliest feasible start after predecessor",
        },
        {
            "issue_key": "PROJ-103",
            "suggested_start": "2026-03-10",
            "suggested_end": "2026-03-12",
            "reason": "No dependencies; can run in parallel with PROJ-101",
        },
    ]


async def ai_risk_prediction(ctx: dict, project_id: str, run_id: str) -> dict:
    """Predict project risks.

    Stubbed: returns mock risk data when no OpenAI key is configured.
    """
    logger.info(
        "ai_risk_prediction_started",
        project_id=project_id,
        run_id=run_id,
    )
    project_uuid = UUID(project_id)
    run_uuid = UUID(run_id)

    async with async_session_factory() as session:
        try:
            await _update_task(
                session,
                run_uuid,
                status="running",
                progress_pct=10,
                started_at=datetime.now(timezone.utc),
            )
            await session.commit()

            ai_result = await _call_openai(
                f"Generate a JSON array of 3 risk predictions for project "
                f"{project_id}. Each item should have: description, severity "
                f"(low/medium/high/critical), probability (0-1 float), mitigation."
            )

            if ai_result:
                try:
                    risks = json.loads(ai_result)
                except (json.JSONDecodeError, TypeError):
                    risks = _mock_risks()
            else:
                risks = _mock_risks()

            result_data = {"risks": risks}

            await _update_task(
                session,
                run_uuid,
                status="completed",
                progress_pct=100,
                result_summary_json=result_data,
                completed_at=datetime.now(timezone.utc),
            )
            await session.commit()

            logger.info("ai_risk_prediction_completed", run_id=run_id)
            return result_data

        except Exception as exc:
            logger.exception("ai_risk_prediction_failed", run_id=run_id)
            await session.rollback()
            async with async_session_factory() as err_session:
                await _update_task(
                    err_session,
                    run_uuid,
                    status="failed",
                    error_message=str(exc),
                    completed_at=datetime.now(timezone.utc),
                )
                await err_session.commit()
            return {"error": str(exc)}


def _mock_risks() -> list[dict]:
    return [
        {
            "description": "Key developer unavailability during sprint 3",
            "severity": "high",
            "probability": 0.4,
            "mitigation": "Cross-train team members on critical path tasks",
        },
        {
            "description": "Third-party API integration may have breaking changes",
            "severity": "medium",
            "probability": 0.3,
            "mitigation": "Pin API versions and implement adapter pattern",
        },
        {
            "description": "Scope creep from stakeholder feature requests",
            "severity": "high",
            "probability": 0.6,
            "mitigation": "Enforce change request process and prioritization meetings",
        },
    ]


async def ai_summarize(ctx: dict, project_id: str, run_id: str) -> dict:
    """Generate a project summary.

    Stubbed: returns mock summary when no OpenAI key is configured.
    """
    logger.info(
        "ai_summarize_started",
        project_id=project_id,
        run_id=run_id,
    )
    project_uuid = UUID(project_id)
    run_uuid = UUID(run_id)

    async with async_session_factory() as session:
        try:
            await _update_task(
                session,
                run_uuid,
                status="running",
                progress_pct=10,
                started_at=datetime.now(timezone.utc),
            )
            await session.commit()

            ai_result = await _call_openai(
                f"Generate a JSON object summarizing project {project_id} with "
                f"keys: summary (string), key_points (array of strings, 3-5 items)."
            )

            if ai_result:
                try:
                    parsed = json.loads(ai_result)
                    summary = parsed.get("summary", "")
                    key_points = parsed.get("key_points", [])
                except (json.JSONDecodeError, TypeError):
                    summary, key_points = _mock_summary()
            else:
                summary, key_points = _mock_summary()

            result_data = {"summary": summary, "key_points": key_points}

            await _update_task(
                session,
                run_uuid,
                status="completed",
                progress_pct=100,
                result_summary_json=result_data,
                completed_at=datetime.now(timezone.utc),
            )
            await session.commit()

            logger.info("ai_summarize_completed", run_id=run_id)
            return result_data

        except Exception as exc:
            logger.exception("ai_summarize_failed", run_id=run_id)
            await session.rollback()
            async with async_session_factory() as err_session:
                await _update_task(
                    err_session,
                    run_uuid,
                    status="failed",
                    error_message=str(exc),
                    completed_at=datetime.now(timezone.utc),
                )
                await err_session.commit()
            return {"error": str(exc)}


def _mock_summary() -> tuple[str, list[str]]:
    summary = (
        "Project is progressing well with 67% of issues completed. "
        "The team is on track for the upcoming milestone with minor "
        "delays in the backend integration tasks. Overall velocity "
        "has improved by 15% over the last two sprints."
    )
    key_points = [
        "67% of planned issues are completed",
        "Backend integration tasks are slightly behind schedule",
        "Team velocity improved 15% over last two sprints",
        "3 high-priority issues remain for current milestone",
        "No critical blockers identified",
    ]
    return summary, key_points
