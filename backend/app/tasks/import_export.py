import csv
import io
import os
from datetime import datetime, timezone
from uuid import UUID

import structlog

from app.core.config import settings
from app.core.database import async_session_factory
from app.models.notification import TaskStatus

logger = structlog.get_logger()

# Issue fields that are valid targets for CSV column mapping
VALID_ISSUE_FIELDS = {
    "summary",
    "description",
    "priority",
    "issue_type_id",
    "assignee_id",
    "reporter_id",
    "milestone_id",
    "estimated_hours",
    "story_points",
    "planned_start",
    "planned_end",
    "rag_status",
}


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


async def import_csv(
    ctx: dict,
    project_id: str,
    file_path: str,
    column_mapping: dict,
    user_id: str,
) -> dict:
    """Read a CSV file, map columns to issue fields, and bulk-create issues.

    Tracks progress in a TaskStatus entry identified by the run_id stored
    in column_mapping['_run_id'].
    """
    run_id = column_mapping.pop("_run_id")
    run_uuid = UUID(run_id)
    project_uuid = UUID(project_id)
    user_uuid = UUID(user_id)

    logger.info(
        "import_csv_started",
        project_id=project_id,
        run_id=run_id,
        file_path=file_path,
    )

    async with async_session_factory() as session:
        try:
            await _update_task(
                session,
                run_uuid,
                status="running",
                progress_pct=5,
                started_at=datetime.now(timezone.utc),
            )
            await session.commit()

            # Read CSV file
            with open(file_path, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                rows = list(reader)

            if not rows:
                await _update_task(
                    session,
                    run_uuid,
                    status="completed",
                    progress_pct=100,
                    result_summary_json={
                        "imported_count": 0,
                        "error_count": 0,
                        "errors": [],
                    },
                    completed_at=datetime.now(timezone.utc),
                )
                await session.commit()
                return {"imported_count": 0, "error_count": 0}

            total = len(rows)
            imported_count = 0
            error_count = 0
            errors: list[str] = []

            # Import the IssueService for creating issues
            from app.services.issue import IssueService

            issue_service = IssueService(session)

            for idx, row in enumerate(rows):
                try:
                    # Map CSV columns to issue fields
                    issue_data: dict = {}
                    for csv_col, issue_field in column_mapping.items():
                        if issue_field in VALID_ISSUE_FIELDS and csv_col in row:
                            value = row[csv_col]
                            if value is not None and str(value).strip():
                                issue_data[issue_field] = str(value).strip()

                    # summary is required
                    if "summary" not in issue_data or not issue_data["summary"]:
                        errors.append(
                            f"Row {idx + 1}: Missing required field 'summary'"
                        )
                        error_count += 1
                        continue

                    # Set default priority if not mapped
                    if "priority" not in issue_data:
                        issue_data["priority"] = "medium"

                    # Convert numeric fields
                    if "estimated_hours" in issue_data:
                        try:
                            issue_data["estimated_hours"] = float(
                                issue_data["estimated_hours"]
                            )
                        except (ValueError, TypeError):
                            del issue_data["estimated_hours"]

                    if "story_points" in issue_data:
                        try:
                            issue_data["story_points"] = int(
                                issue_data["story_points"]
                            )
                        except (ValueError, TypeError):
                            del issue_data["story_points"]

                    await issue_service.create_issue(
                        project_uuid,
                        issue_data,
                        reporter_id=user_uuid,
                        created_by=user_uuid,
                    )
                    imported_count += 1

                except Exception as row_exc:
                    error_count += 1
                    errors.append(f"Row {idx + 1}: {str(row_exc)}")
                    logger.warning(
                        "import_csv_row_error",
                        row=idx + 1,
                        error=str(row_exc),
                    )

                # Update progress periodically
                if (idx + 1) % max(1, total // 20) == 0 or idx == total - 1:
                    progress = int(5 + (90 * (idx + 1) / total))
                    await _update_task(
                        session, run_uuid, progress_pct=progress
                    )
                    await session.commit()

            result_data = {
                "imported_count": imported_count,
                "error_count": error_count,
                "errors": errors[:50],  # Cap at 50 error messages
            }

            await _update_task(
                session,
                run_uuid,
                status="completed",
                progress_pct=100,
                result_summary_json=result_data,
                completed_at=datetime.now(timezone.utc),
            )
            await session.commit()

            # Clean up the uploaded CSV file
            try:
                os.remove(file_path)
            except OSError:
                pass

            logger.info(
                "import_csv_completed",
                run_id=run_id,
                imported=imported_count,
                errors=error_count,
            )
            return result_data

        except Exception as exc:
            logger.exception("import_csv_failed", run_id=run_id)
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


async def export_csv(
    ctx: dict,
    project_id: str,
    filters: dict | None,
    user_id: str,
    run_id: str,
) -> dict:
    """Query issues for a project and write them to a CSV file.

    The resulting file path is saved in the TaskStatus result_summary_json.
    """
    run_uuid = UUID(run_id)
    project_uuid = UUID(project_id)

    logger.info(
        "export_csv_started",
        project_id=project_id,
        run_id=run_id,
    )

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

            # Fetch issues
            from app.services.issue import IssueService

            issue_service = IssueService(session)

            filter_kwargs: dict = {}
            if filters:
                for key in (
                    "status_id",
                    "issue_type_id",
                    "assignee_id",
                    "priority",
                    "milestone_id",
                ):
                    if key in filters:
                        filter_kwargs[key] = filters[key]

            result = await issue_service.list_issues(
                project_uuid, limit=10000, **filter_kwargs
            )
            issues = result.get("data", [])

            await _update_task(session, run_uuid, progress_pct=50)
            await session.commit()

            # Define CSV columns
            csv_columns = [
                "issue_key",
                "summary",
                "description",
                "priority",
                "rag_status",
                "estimated_hours",
                "story_points",
                "percent_complete",
                "planned_start",
                "planned_end",
                "actual_start",
                "actual_end",
                "created_at",
                "updated_at",
            ]

            # Write CSV file
            export_dir = os.path.join(settings.UPLOAD_DIR, "exports")
            os.makedirs(export_dir, exist_ok=True)
            file_name = f"export_{project_id}_{run_id}.csv"
            file_path = os.path.join(export_dir, file_name)

            with open(file_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=csv_columns)
                writer.writeheader()

                for issue in issues:
                    row = {}
                    for col in csv_columns:
                        value = getattr(issue, col, None)
                        row[col] = str(value) if value is not None else ""
                    writer.writerow(row)

            result_data = {
                "file_path": file_path,
                "file_name": file_name,
                "issue_count": len(issues),
            }

            await _update_task(
                session,
                run_uuid,
                status="completed",
                progress_pct=100,
                result_summary_json=result_data,
                completed_at=datetime.now(timezone.utc),
            )
            await session.commit()

            logger.info(
                "export_csv_completed",
                run_id=run_id,
                issue_count=len(issues),
            )
            return result_data

        except Exception as exc:
            logger.exception("export_csv_failed", run_id=run_id)
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
