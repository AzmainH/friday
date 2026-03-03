from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException, ValidationException
from app.models.intake import IntakeForm, IntakeSubmission
from app.repositories.intake import IntakeFormRepository, IntakeSubmissionRepository


class IntakeService:
    def __init__(self, session: AsyncSession):
        self.form_repo = IntakeFormRepository(session)
        self.submission_repo = IntakeSubmissionRepository(session)
        self.session = session

    # ── Intake Forms ────────────────────────────────────────────

    async def get_form(self, form_id: UUID) -> IntakeForm:
        form = await self.form_repo.get_by_id(form_id)
        if not form:
            raise NotFoundException("Intake form not found")
        return form

    async def list_forms_by_project(
        self,
        project_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.form_repo.get_by_project(
            project_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_form(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ) -> IntakeForm:
        data["project_id"] = project_id

        if data.get("public_slug"):
            existing = await self.form_repo.get_by_slug(data["public_slug"])
            if existing:
                raise ConflictException("A form with this public slug already exists")

        return await self.form_repo.create(data, created_by=created_by)

    async def update_form(
        self,
        form_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> IntakeForm:
        await self.get_form(form_id)

        if data.get("public_slug"):
            existing = await self.form_repo.get_by_slug(data["public_slug"])
            if existing and existing.id != form_id:
                raise ConflictException("A form with this public slug already exists")

        updated = await self.form_repo.update(
            form_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Intake form not found")
        return updated

    async def delete_form(self, form_id: UUID) -> bool:
        deleted = await self.form_repo.hard_delete(form_id)
        if not deleted:
            raise NotFoundException("Intake form not found")
        return True

    # ── Public Submission ───────────────────────────────────────

    async def submit_public(
        self, public_slug: str, data: dict
    ) -> IntakeSubmission:
        form = await self.form_repo.get_by_slug(public_slug)
        if not form:
            raise NotFoundException("Intake form not found")
        if not form.is_active:
            raise ValidationException("This intake form is no longer accepting submissions")

        submission_data = {
            "form_id": form.id,
            "data_json": data.get("data_json", {}),
            "submitted_by_email": data.get("submitted_by_email"),
            "submitted_by_name": data.get("submitted_by_name"),
            "status": "pending",
        }
        return await self.submission_repo.create(submission_data)

    # ── Submissions Management ──────────────────────────────────

    async def list_submissions(
        self,
        form_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        await self.get_form(form_id)
        return await self.submission_repo.get_by_form(
            form_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def review_submission(
        self,
        submission_id: UUID,
        status: str,
        *,
        reviewed_by: UUID | None = None,
        notes: str | None = None,
    ) -> IntakeSubmission:
        submission = await self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise NotFoundException("Intake submission not found")

        valid_statuses = ("accepted", "rejected")
        if status not in valid_statuses:
            raise ValidationException(
                f"Invalid status: {status}. Must be one of: {', '.join(valid_statuses)}"
            )

        if submission.status != "pending":
            raise ConflictException("Submission has already been reviewed")

        update_data: dict = {
            "status": status,
            "reviewed_at": datetime.now(timezone.utc),
        }
        if reviewed_by:
            update_data["reviewed_by"] = reviewed_by

        updated = await self.submission_repo.update(submission_id, update_data)
        if not updated:
            raise NotFoundException("Intake submission not found")
        return updated
