"""Seed a comprehensive demo project: 'His Girl Friday'. Idempotent."""

import asyncio
import logging
import uuid
from datetime import date

from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.core.deps import _DEV_USER_ID
from app.models import (
    AutomationRule,
    Component,
    CostEntry,
    CustomFieldDefinition,
    CustomFieldType,
    Decision,
    Issue,
    IssueComment,
    IssueLink,
    IssueLinkType,
    IssueType,
    Label,
    Milestone,
    Project,
    ProjectBudget,
    ProjectIssueCounter,
    RACIAssignment,
    Stakeholder,
    TimeEntry,
    User,
    Version,
    Workflow,
    WorkflowStatus,
    Workspace,
    Organization,
    StatusCategory,
    issue_labels,
)
from app.models.automation import ActionType, TriggerType
from app.models.budget import CostCategory
from app.models.decision import DecisionStatus
from app.models.milestone import MilestoneStatus, MilestoneType
from app.models.project import ProjectStatus, RAGStatus
from app.models.raci import RACIRoleType

logger = logging.getLogger(__name__)


async def seed_demo_project(session: AsyncSession) -> None:
    """Create a fully-populated demo project called 'His Girl Friday'."""

    # ── Idempotency check ────────────────────────────────────────────
    result = await session.execute(
        select(Project).where(Project.key_prefix == "HGF", Project.is_deleted == False)  # noqa: E712
    )
    if result.scalar_one_or_none():
        logger.info("Demo project 'His Girl Friday' already exists, skipping seed")
        return

    # ── Locate default workspace ─────────────────────────────────────
    result = await session.execute(
        select(Workspace).join(Organization).where(
            Organization.slug == "default",
            Workspace.slug == "default",
        )
    )
    ws = result.scalar_one_or_none()
    if not ws:
        logger.warning("Default workspace not found, skipping demo seed")
        return

    # ── Pre-generate UUIDs ───────────────────────────────────────────
    # Users
    uid_rosalind = uuid.uuid4()
    uid_cary = uuid.uuid4()
    uid_ralph = uuid.uuid4()
    uid_howard = uuid.uuid4()
    uid_gene = uuid.uuid4()
    uid_irene = uuid.uuid4()
    uid_billy = uuid.uuid4()
    uid_hedy = uuid.uuid4()
    uid_orson = uuid.uuid4()
    uid_dev = _DEV_USER_ID

    # Project
    pid = uuid.uuid4()

    # Workflow + statuses
    wf_id = uuid.uuid4()
    sid_backlog = uuid.uuid4()
    sid_ready = uuid.uuid4()
    sid_in_progress = uuid.uuid4()
    sid_in_review = uuid.uuid4()
    sid_blocked = uuid.uuid4()
    sid_qa = uuid.uuid4()
    sid_done = uuid.uuid4()

    # Issue types
    itid_epic = uuid.uuid4()
    itid_story = uuid.uuid4()
    itid_task = uuid.uuid4()
    itid_bug = uuid.uuid4()
    itid_subtask = uuid.uuid4()

    # Labels
    lid_preprod = uuid.uuid4()
    lid_photo = uuid.uuid4()
    lid_postprod = uuid.uuid4()
    lid_vfx = uuid.uuid4()
    lid_sound = uuid.uuid4()
    lid_marketing = uuid.uuid4()
    lid_legal = uuid.uuid4()
    lid_casting = uuid.uuid4()
    lid_location = uuid.uuid4()
    lid_urgent = uuid.uuid4()
    lid_blocked_ext = uuid.uuid4()
    lid_client_facing = uuid.uuid4()
    lid_tech_debt = uuid.uuid4()
    lid_creative_review = uuid.uuid4()

    # Milestones
    msid_greenlight = uuid.uuid4()
    msid_script_lock = uuid.uuid4()
    msid_casting_complete = uuid.uuid4()
    msid_photo_wrap = uuid.uuid4()
    msid_rough_cut = uuid.uuid4()
    msid_final_mix = uuid.uuid4()
    msid_festival = uuid.uuid4()
    msid_release = uuid.uuid4()

    # Issues HGF-1 through HGF-62
    iid = {}
    for n in range(1, 63):
        iid[n] = uuid.uuid4()

    # ── Users ────────────────────────────────────────────────────────
    users_data = [
        (uid_rosalind, "rosalind@friday.local", "Rosalind Russell", "America/Los_Angeles"),
        (uid_cary, "cary@friday.local", "Cary Grant", "America/New_York"),
        (uid_ralph, "ralph@friday.local", "Ralph Bellamy", "America/Chicago"),
        (uid_howard, "howard@friday.local", "Howard Hawks", "America/Los_Angeles"),
        (uid_gene, "gene@friday.local", "Gene Lockhart", "America/New_York"),
        (uid_irene, "irene@friday.local", "Irene Dunne", "America/Los_Angeles"),
        (uid_billy, "billy@friday.local", "Billy Wilder", "Europe/Berlin"),
        (uid_hedy, "hedy@friday.local", "Hedy Lamarr", "America/New_York"),
        (uid_orson, "orson@friday.local", "Orson Welles", "Europe/London"),
    ]
    for uid, email, name, tz in users_data:
        session.add(User(
            id=uid,
            email=email,
            display_name=name,
            timezone=tz,
            is_active=True,
            is_deleted=False,
        ))
    await session.flush()
    logger.info("Created 9 demo users")

    # ── Project ──────────────────────────────────────────────────────
    project = Project(
        id=pid,
        workspace_id=ws.id,
        name="His Girl Friday",
        key_prefix="HGF",
        description=(
            "Modern remake of the 1940 Howard Hawks screwball comedy classic. "
            "A $12.5M production spanning development, pre-production, principal "
            "photography across NYC and Chicago, post-production with 80+ VFX "
            "shots, and a fall 2026 theatrical release campaign."
        ),
        status=ProjectStatus.ACTIVE,
        lead_id=uid_dev,
        start_date=date(2026, 1, 5),
        target_end_date=date(2026, 9, 30),
        rag_status=RAGStatus.GREEN,
        is_deleted=False,
        created_by=uid_dev,
    )
    session.add(project)
    await session.flush()
    logger.info("Created project 'His Girl Friday'")

    # ── Workflow & Statuses ──────────────────────────────────────────
    workflow = Workflow(
        id=wf_id,
        project_id=pid,
        name="Production Pipeline",
        description="Standard film production workflow",
        is_default=True,
    )
    session.add(workflow)
    await session.flush()

    statuses_data = [
        (sid_backlog, "Backlog", StatusCategory.TO_DO, "#A3A3A3", 0),
        (sid_ready, "Ready", StatusCategory.TO_DO, "#8E9AAF", 1),
        (sid_in_progress, "In Progress", StatusCategory.IN_PROGRESS, "#3574D4", 2),
        (sid_in_review, "In Review", StatusCategory.IN_REVIEW, "#7E57C2", 3),
        (sid_blocked, "Blocked", StatusCategory.BLOCKED, "#D84040", 4),
        (sid_qa, "QA/Approval", StatusCategory.IN_REVIEW, "#E8A317", 5),
        (sid_done, "Done", StatusCategory.DONE, "#2E9E5A", 6),
    ]
    for s_id, s_name, s_cat, s_color, s_order in statuses_data:
        session.add(WorkflowStatus(
            id=s_id,
            workflow_id=wf_id,
            name=s_name,
            category=s_cat,
            color=s_color,
            sort_order=s_order,
        ))
    await session.flush()
    logger.info("Created workflow with 7 statuses")

    # ── Issue Types ──────────────────────────────────────────────────
    issue_types_data = [
        (itid_epic, "Epic", "layers", "#7E57C2", 0, False, 0),
        (itid_story, "Story", "bookmark", "#3574D4", 1, False, 1),
        (itid_task, "Task", "check-square", "#009688", 2, False, 2),
        (itid_bug, "Bug", "alert-circle", "#D84040", 2, False, 3),
        (itid_subtask, "Subtask", "minus-square", "#8E9AAF", 3, True, 4),
    ]
    for it_id, it_name, it_icon, it_color, it_level, it_sub, it_order in issue_types_data:
        session.add(IssueType(
            id=it_id,
            project_id=pid,
            name=it_name,
            icon=it_icon,
            color=it_color,
            hierarchy_level=it_level,
            is_subtask=it_sub,
            sort_order=it_order,
        ))
    await session.flush()
    logger.info("Created 5 issue types")

    # ── Labels ───────────────────────────────────────────────────────
    labels_data = [
        (lid_preprod, "Pre-Production", "#009688"),
        (lid_photo, "Principal Photography", "#3574D4"),
        (lid_postprod, "Post-Production", "#7E57C2"),
        (lid_vfx, "VFX", "#00838F"),
        (lid_sound, "Sound", "#8E9AAF"),
        (lid_marketing, "Marketing", "#E8A317"),
        (lid_legal, "Legal", "#D84040"),
        (lid_casting, "Casting", "#C2185B"),
        (lid_location, "Location", "#2E9E5A"),
        (lid_urgent, "Urgent", "#C62828"),
        (lid_blocked_ext, "Blocked-External", "#D84040"),
        (lid_client_facing, "Client-Facing", "#3574D4"),
        (lid_tech_debt, "Technical-Debt", "#6E7A8E"),
        (lid_creative_review, "Creative-Review", "#EF6C00"),
    ]
    for l_id, l_name, l_color in labels_data:
        session.add(Label(id=l_id, project_id=pid, name=l_name, color=l_color))
    await session.flush()
    logger.info("Created 14 labels")

    # ── Components ───────────────────────────────────────────────────
    components_data = [
        ("Screenplay", "Script development and revisions", uid_rosalind),
        ("Cinematography", "Camera work, lighting, and visual composition", uid_ralph),
        ("Sound Design", "Production audio, ADR, Foley, and mixing", uid_gene),
        ("Visual Effects", "VFX compositing, matte painting, wire removal", uid_hedy),
        ("Marketing & Distribution", "Trailers, press, festival strategy", uid_orson),
        ("Production Design", "Sets, props, and art department", uid_orson),
        ("Music & Score", "Original score composition and recording", uid_billy),
    ]
    for c_name, c_desc, c_lead in components_data:
        session.add(Component(project_id=pid, name=c_name, description=c_desc, lead_id=c_lead))
    await session.flush()
    logger.info("Created 7 components")

    # ── Versions ─────────────────────────────────────────────────────
    session.add(Version(
        project_id=pid,
        name="v0.1 — Development & Pre-Production",
        description="Script development, casting, location scouting, set construction",
        start_date=date(2025, 11, 1),
        release_date=date(2026, 3, 1),
        status="released",
    ))
    session.add(Version(
        project_id=pid,
        name="v0.2 — Principal Photography",
        description="All shooting blocks including pick-ups",
        start_date=date(2026, 3, 15),
        release_date=None,
        status="unreleased",
    ))
    session.add(Version(
        project_id=pid,
        name="v1.0 — Final Delivery & Release",
        description="Post-production, DCP mastering, and theatrical release",
        start_date=date(2026, 8, 1),
        release_date=None,
        status="unreleased",
    ))
    await session.flush()
    logger.info("Created 3 versions")

    # ── Custom Fields ────────────────────────────────────────────────
    session.add(CustomFieldDefinition(
        project_id=pid,
        name="Department",
        field_type=CustomFieldType.SINGLE_SELECT,
        description="Production department responsible",
        options_json={"options": ["Directing", "Production", "Post-Production", "Marketing", "Legal"]},
        is_required=False,
        sort_order=0,
    ))
    session.add(CustomFieldDefinition(
        project_id=pid,
        name="Shoot Day",
        field_type=CustomFieldType.NUMBER,
        description="Shoot day number on the production calendar",
        is_required=False,
        sort_order=1,
    ))
    session.add(CustomFieldDefinition(
        project_id=pid,
        name="Deliverable Format",
        field_type=CustomFieldType.SINGLE_SELECT,
        description="Final deliverable format specification",
        options_json={"options": ["ProRes 4444", "DCP", "H.264", "DNxHR"]},
        is_required=False,
        sort_order=2,
    ))
    session.add(CustomFieldDefinition(
        project_id=pid,
        name="Client Approved",
        field_type=CustomFieldType.CHECKBOX,
        description="Whether this item has been approved by the client",
        is_required=False,
        sort_order=3,
    ))
    await session.flush()
    logger.info("Created 4 custom field definitions")

    # ── Milestones ───────────────────────────────────────────────────
    milestones_data = [
        (msid_greenlight, "Development Greenlight", "Studio approval to proceed with development",
         MilestoneType.PHASE_GATE, MilestoneStatus.COMPLETED,
         date(2025, 11, 1), date(2025, 12, 20), 100, 0),
        (msid_script_lock, "Script Lock", "Final screenplay locked for production",
         MilestoneType.PHASE_GATE, MilestoneStatus.COMPLETED,
         date(2026, 1, 5), date(2026, 2, 14), 100, 1),
        (msid_casting_complete, "Casting Complete", "All principal and supporting cast confirmed",
         MilestoneType.DELIVERABLE, MilestoneStatus.COMPLETED,
         date(2026, 1, 20), date(2026, 3, 1), 100, 2),
        (msid_photo_wrap, "Principal Photography Wrap", "All shooting blocks completed",
         MilestoneType.PHASE_GATE, MilestoneStatus.IN_PROGRESS,
         date(2026, 3, 15), date(2026, 6, 15), 55, 3),
        (msid_rough_cut, "Rough Cut Review", "First full assembly reviewed by director and producers",
         MilestoneType.REVIEW, MilestoneStatus.NOT_STARTED,
         date(2026, 6, 20), date(2026, 7, 31), 0, 4),
        (msid_final_mix, "Final Mix & Color", "Sound mix and color grading locked",
         MilestoneType.DELIVERABLE, MilestoneStatus.NOT_STARTED,
         date(2026, 8, 1), date(2026, 8, 31), 0, 5),
        (msid_festival, "Festival Submission Deadline", "Submission package delivered to festivals",
         MilestoneType.PAYMENT, MilestoneStatus.NOT_STARTED,
         date(2026, 9, 1), date(2026, 9, 10), 0, 6),
        (msid_release, "Theatrical Release", "Film opens in theatres nationwide",
         MilestoneType.PHASE_GATE, MilestoneStatus.NOT_STARTED,
         date(2026, 9, 15), date(2026, 9, 30), 0, 7),
    ]
    for ms_id, ms_name, ms_desc, ms_type, ms_status, ms_start, ms_due, ms_pct, ms_order in milestones_data:
        session.add(Milestone(
            id=ms_id,
            project_id=pid,
            name=ms_name,
            description=ms_desc,
            milestone_type=ms_type,
            status=ms_status,
            start_date=ms_start,
            due_date=ms_due,
            progress_pct=ms_pct,
            sort_order=ms_order,
            is_deleted=False,
        ))
    await session.flush()
    logger.info("Created 8 milestones")

    # ── Helper to create issues ──────────────────────────────────────
    def _issue(
        num, type_id, status_id, summary, *,
        priority="medium", assignee_id=None, parent_num=None,
        milestone_id=None, est_hours=None, story_points=None,
        pct=0, rag="none",
        planned_start=None, planned_end=None,
        actual_start=None, actual_end=None,
        description=None,
    ):
        return Issue(
            id=iid[num],
            project_id=pid,
            issue_type_id=type_id,
            status_id=status_id,
            issue_key=f"HGF-{num}",
            summary=summary,
            description=description,
            priority=priority,
            assignee_id=assignee_id,
            reporter_id=uid_dev,
            parent_issue_id=iid[parent_num] if parent_num else None,
            milestone_id=milestone_id,
            estimated_hours=est_hours,
            story_points=story_points,
            percent_complete=pct,
            rag_status=rag,
            planned_start=planned_start,
            planned_end=planned_end,
            actual_start=actual_start,
            actual_end=actual_end,
            sort_order=float(num),
            is_deleted=False,
        )

    # ── Issues ───────────────────────────────────────────────────────

    # --- Epic 1: Development & Screenplay (all Done, milestone=Script Lock) ---
    session.add(_issue(1, itid_epic, sid_done,
        "Development & Screenplay",
        pct=100, milestone_id=msid_script_lock,
        planned_start=date(2026, 1, 5), planned_end=date(2026, 2, 14),
        actual_start=date(2026, 1, 5), actual_end=date(2026, 2, 14),
        assignee_id=uid_rosalind,
    ))
    session.add(_issue(2, itid_story, sid_done,
        "Initial screenplay draft",
        assignee_id=uid_rosalind, story_points=40, est_hours=80,
        pct=100, milestone_id=msid_script_lock,
        planned_start=date(2026, 1, 5), planned_end=date(2026, 1, 25),
        actual_start=date(2026, 1, 5), actual_end=date(2026, 1, 24),
        parent_num=1,
    ))
    session.add(_issue(3, itid_story, sid_done,
        "Screenplay table read with cast",
        assignee_id=uid_cary, story_points=20, est_hours=24,
        pct=100, milestone_id=msid_script_lock,
        planned_start=date(2026, 1, 26), planned_end=date(2026, 1, 30),
        actual_start=date(2026, 1, 27), actual_end=date(2026, 1, 30),
        parent_num=1,
    ))
    session.add(_issue(4, itid_story, sid_done,
        "Finalize screenplay v3 with studio notes",
        assignee_id=uid_rosalind, story_points=30, est_hours=60,
        pct=100, milestone_id=msid_script_lock,
        planned_start=date(2026, 1, 31), planned_end=date(2026, 2, 14),
        actual_start=date(2026, 2, 1), actual_end=date(2026, 2, 13),
        parent_num=1,
    ))
    session.add(_issue(5, itid_task, sid_done,
        "Register screenplay with WGA",
        assignee_id=uid_gene, est_hours=4,
        pct=100, milestone_id=msid_script_lock,
        planned_start=date(2026, 2, 10), planned_end=date(2026, 2, 12),
        actual_start=date(2026, 2, 10), actual_end=date(2026, 2, 11),
        parent_num=1,
    ))
    session.add(_issue(6, itid_task, sid_done,
        "Secure underlying rights & IP clearance",
        assignee_id=uid_gene, est_hours=40,
        pct=100, milestone_id=msid_script_lock,
        planned_start=date(2026, 1, 5), planned_end=date(2026, 2, 5),
        actual_start=date(2026, 1, 6), actual_end=date(2026, 2, 3),
        parent_num=1,
    ))
    session.add(_issue(7, itid_task, sid_done,
        "Research 1940s journalism accuracy",
        assignee_id=uid_billy, est_hours=30,
        pct=100, milestone_id=msid_script_lock,
        planned_start=date(2026, 1, 5), planned_end=date(2026, 1, 20),
        actual_start=date(2026, 1, 6), actual_end=date(2026, 1, 19),
        parent_num=1,
    ))
    session.add(_issue(8, itid_bug, sid_done,
        "Copyright issue with newspaper headline props",
        assignee_id=uid_gene, est_hours=12, priority="high",
        pct=100, milestone_id=msid_script_lock,
        planned_start=date(2026, 1, 15), planned_end=date(2026, 1, 20),
        actual_start=date(2026, 1, 15), actual_end=date(2026, 1, 19),
        parent_num=1,
    ))

    # --- Epic 2: Pre-Production (mostly Done, milestone=Casting Complete) ---
    session.add(_issue(9, itid_epic, sid_done,
        "Pre-Production",
        pct=100, milestone_id=msid_casting_complete,
        planned_start=date(2026, 1, 20), planned_end=date(2026, 3, 1),
        actual_start=date(2026, 1, 20), actual_end=date(2026, 3, 1),
        assignee_id=uid_cary,
    ))
    session.add(_issue(10, itid_story, sid_done,
        "Location scouting — NYC 5 locations",
        assignee_id=uid_ralph, story_points=25, est_hours=40,
        pct=100, milestone_id=msid_casting_complete,
        planned_start=date(2026, 2, 1), planned_end=date(2026, 2, 15),
        actual_start=date(2026, 2, 3), actual_end=date(2026, 2, 14),
        parent_num=9,
    ))
    session.add(_issue(11, itid_story, sid_done,
        "Location scouting — Chicago 3 locations",
        assignee_id=uid_ralph, story_points=20, est_hours=32,
        pct=100, milestone_id=msid_casting_complete,
        planned_start=date(2026, 2, 10), planned_end=date(2026, 2, 22),
        actual_start=date(2026, 2, 11), actual_end=date(2026, 2, 21),
        parent_num=9,
    ))
    session.add(_issue(12, itid_task, sid_done,
        "Secure filming permits — all jurisdictions",
        assignee_id=uid_irene, est_hours=20,
        pct=100, milestone_id=msid_casting_complete,
        planned_start=date(2026, 2, 15), planned_end=date(2026, 2, 28),
        actual_start=date(2026, 2, 16), actual_end=date(2026, 2, 27),
        parent_num=9,
    ))
    session.add(_issue(13, itid_story, sid_done,
        "Casting lead roles — Hildy, Walter, Bruce",
        assignee_id=uid_cary, story_points=40, est_hours=60,
        pct=100, milestone_id=msid_casting_complete,
        planned_start=date(2026, 2, 1), planned_end=date(2026, 2, 20),
        actual_start=date(2026, 2, 3), actual_end=date(2026, 2, 18),
        parent_num=9,
    ))
    session.add(_issue(14, itid_story, sid_done,
        "Casting supporting roles — 12 parts",
        assignee_id=uid_cary, story_points=25, est_hours=48,
        pct=100, milestone_id=msid_casting_complete,
        planned_start=date(2026, 2, 15), planned_end=date(2026, 3, 1),
        actual_start=date(2026, 2, 16), actual_end=date(2026, 2, 28),
        parent_num=9,
    ))
    session.add(_issue(15, itid_task, sid_done,
        "Costume design — period-modern hybrid approval",
        assignee_id=uid_irene, est_hours=36,
        pct=100, milestone_id=msid_casting_complete,
        planned_start=date(2026, 2, 1), planned_end=date(2026, 2, 20),
        actual_start=date(2026, 2, 1), actual_end=date(2026, 2, 18),
        parent_num=9,
    ))
    session.add(_issue(16, itid_task, sid_done,
        "Production design — newsroom set build",
        assignee_id=uid_orson, est_hours=80,
        pct=100, milestone_id=msid_casting_complete,
        planned_start=date(2026, 2, 1), planned_end=date(2026, 3, 10),
        actual_start=date(2026, 2, 5), actual_end=date(2026, 3, 5),
        parent_num=9,
    ))
    session.add(_issue(17, itid_bug, sid_done,
        "Union scheduling conflict — grip crew",
        assignee_id=uid_howard, est_hours=8, priority="high",
        pct=100, milestone_id=msid_casting_complete,
        planned_start=date(2026, 2, 20), planned_end=date(2026, 2, 25),
        actual_start=date(2026, 2, 21), actual_end=date(2026, 2, 24),
        parent_num=9,
    ))

    # --- Epic 3: Principal Photography Block A (mixed, milestone=Photo Wrap) ---
    session.add(_issue(18, itid_epic, sid_in_progress,
        "Principal Photography — Block A",
        pct=45, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 3, 15), planned_end=date(2026, 5, 15),
        actual_start=date(2026, 3, 15),
        assignee_id=uid_rosalind, rag="green",
    ))
    session.add(_issue(19, itid_story, sid_done,
        "Wk 1-2 Newsroom interior scenes — 18 pages",
        assignee_id=uid_rosalind, story_points=30, est_hours=120,
        pct=100, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 3, 15), planned_end=date(2026, 3, 28),
        actual_start=date(2026, 3, 15), actual_end=date(2026, 3, 27),
        parent_num=18,
    ))
    session.add(_issue(20, itid_story, sid_in_progress,
        "Wk 3-4 Courthouse exteriors & jail",
        assignee_id=uid_rosalind, story_points=35, est_hours=100,
        pct=40, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 3, 29), planned_end=date(2026, 4, 11),
        actual_start=date(2026, 3, 30),
        parent_num=18, rag="amber",
    ))
    session.add(_issue(21, itid_story, sid_ready,
        "Wk 5-6 Restaurant, apartment & hotel scenes",
        assignee_id=uid_howard, story_points=25, est_hours=80,
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 4, 14), planned_end=date(2026, 4, 25),
        parent_num=18,
    ))
    session.add(_issue(22, itid_task, sid_in_progress,
        "Stunt coordination — rooftop chase sequence",
        assignee_id=uid_hedy, est_hours=60, priority="high",
        pct=30, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 3, 20), planned_end=date(2026, 4, 20),
        actual_start=date(2026, 3, 25),
        parent_num=18,
    ))
    session.add(_issue(23, itid_task, sid_ready,
        "Drone shots — establishing city skyline montage",
        assignee_id=uid_ralph, est_hours=16,
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 4, 5), planned_end=date(2026, 4, 10),
        parent_num=18,
    ))
    session.add(_issue(24, itid_bug, sid_in_review,
        "Audio sync drift on Day 12 dailies — Scenes 34-38",
        assignee_id=uid_gene, est_hours=12, priority="critical",
        pct=60, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 4, 1), planned_end=date(2026, 4, 3),
        actual_start=date(2026, 4, 1),
        parent_num=18, rag="red",
    ))
    session.add(_issue(25, itid_bug, sid_qa,
        "Continuity error — Walter's hat in courthouse",
        assignee_id=uid_howard, est_hours=4, priority="medium",
        pct=80, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 4, 2), planned_end=date(2026, 4, 4),
        actual_start=date(2026, 4, 2),
        parent_num=18,
    ))
    session.add(_issue(26, itid_task, sid_done,
        "Weather contingency plan — outdoor shoot days",
        assignee_id=uid_irene, est_hours=8,
        pct=100, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 3, 10), planned_end=date(2026, 3, 14),
        actual_start=date(2026, 3, 10), actual_end=date(2026, 3, 13),
        parent_num=18,
    ))

    # --- Epic 4: Principal Photography Block B (mostly Backlog/Ready) ---
    session.add(_issue(27, itid_epic, sid_backlog,
        "Principal Photography — Block B",
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 4, 28), planned_end=date(2026, 6, 15),
        assignee_id=uid_rosalind,
    ))
    session.add(_issue(28, itid_story, sid_backlog,
        "Wk 7-8 Climax courtroom scene — 22 pages",
        assignee_id=uid_rosalind, story_points=40, est_hours=140,
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 4, 28), planned_end=date(2026, 5, 9),
        parent_num=27,
    ))
    session.add(_issue(29, itid_story, sid_backlog,
        "Wk 9-10 Final confrontation & resolution",
        assignee_id=uid_rosalind, story_points=30, est_hours=100,
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 5, 12), planned_end=date(2026, 5, 23),
        parent_num=27,
    ))
    session.add(_issue(30, itid_task, sid_ready,
        "B-roll city footage — time-lapse & street scenes",
        assignee_id=uid_ralph, est_hours=24,
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 5, 1), planned_end=date(2026, 5, 5),
        parent_num=27,
    ))
    session.add(_issue(31, itid_task, sid_backlog,
        "Insert shots — newspaper headlines, clocks, phones",
        assignee_id=uid_howard, est_hours=16,
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 5, 15), planned_end=date(2026, 5, 18),
        parent_num=27,
    ))
    session.add(_issue(32, itid_story, sid_backlog,
        "Pick-up shots & coverage gaps",
        assignee_id=uid_howard, story_points=15, est_hours=40,
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 5, 25), planned_end=date(2026, 6, 5),
        parent_num=27,
    ))
    session.add(_issue(33, itid_bug, sid_backlog,
        "Lens flare artifacts on wide courtroom shots",
        assignee_id=uid_ralph, est_hours=8, priority="low",
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 5, 10), planned_end=date(2026, 5, 12),
        parent_num=27,
    ))
    session.add(_issue(34, itid_task, sid_backlog,
        "Wrap — equipment return & location restoration",
        assignee_id=uid_irene, est_hours=20,
        pct=0, milestone_id=msid_photo_wrap,
        planned_start=date(2026, 6, 10), planned_end=date(2026, 6, 15),
        parent_num=27,
    ))

    # --- Epic 5: Post-Production (mostly Backlog) ---
    session.add(_issue(35, itid_epic, sid_backlog,
        "Post-Production",
        pct=0, milestone_id=msid_rough_cut,
        planned_start=date(2026, 6, 16), planned_end=date(2026, 8, 31),
        assignee_id=uid_howard,
    ))
    session.add(_issue(36, itid_story, sid_backlog,
        "Assembly cut edit — full 2hr+ assembly",
        assignee_id=uid_howard, story_points=50, est_hours=160,
        pct=0, milestone_id=msid_rough_cut,
        planned_start=date(2026, 6, 16), planned_end=date(2026, 7, 10),
        parent_num=35,
    ))
    session.add(_issue(37, itid_story, sid_backlog,
        "Director's cut refinement",
        assignee_id=uid_rosalind, story_points=40, est_hours=120,
        pct=0, milestone_id=msid_rough_cut,
        planned_start=date(2026, 7, 11), planned_end=date(2026, 7, 31),
        parent_num=35,
    ))
    session.add(_issue(38, itid_story, sid_backlog,
        "VFX compositing — 84 shots breakdown",
        assignee_id=uid_hedy, story_points=60, est_hours=200,
        pct=0, milestone_id=msid_rough_cut,
        planned_start=date(2026, 7, 1), planned_end=date(2026, 8, 15),
        parent_num=35,
    ))
    session.add(_issue(39, itid_task, sid_backlog,
        "ADR recording sessions — 8 actors, 3 days",
        assignee_id=uid_gene, est_hours=48,
        pct=0, milestone_id=msid_final_mix,
        planned_start=date(2026, 7, 15), planned_end=date(2026, 7, 20),
        parent_num=35,
    ))
    session.add(_issue(40, itid_task, sid_backlog,
        "Foley & sound effects design",
        assignee_id=uid_gene, est_hours=80,
        pct=0, milestone_id=msid_final_mix,
        planned_start=date(2026, 7, 20), planned_end=date(2026, 8, 10),
        parent_num=35,
    ))
    session.add(_issue(41, itid_story, sid_backlog,
        "Original score composition — 14 cues",
        assignee_id=uid_billy, story_points=35, est_hours=100,
        pct=0, milestone_id=msid_final_mix,
        planned_start=date(2026, 7, 1), planned_end=date(2026, 8, 1),
        parent_num=35,
    ))
    session.add(_issue(42, itid_task, sid_backlog,
        "Score recording — 60-piece orchestra",
        assignee_id=uid_billy, est_hours=40,
        pct=0, milestone_id=msid_final_mix,
        planned_start=date(2026, 8, 5), planned_end=date(2026, 8, 15),
        parent_num=35,
    ))
    session.add(_issue(43, itid_story, sid_backlog,
        "Color grading — establish look per location",
        assignee_id=uid_ralph, story_points=25, est_hours=60,
        pct=0, milestone_id=msid_final_mix,
        planned_start=date(2026, 8, 10), planned_end=date(2026, 8, 25),
        parent_num=35,
    ))
    session.add(_issue(44, itid_task, sid_backlog,
        "DCP mastering & delivery specs",
        assignee_id=uid_orson, est_hours=16,
        pct=0, milestone_id=msid_final_mix,
        planned_start=date(2026, 8, 25), planned_end=date(2026, 8, 31),
        parent_num=35,
    ))
    session.add(_issue(45, itid_task, sid_backlog,
        "Closed caption & subtitle creation — 5 languages",
        assignee_id=uid_irene, est_hours=30,
        pct=0, milestone_id=msid_final_mix,
        planned_start=date(2026, 8, 20), planned_end=date(2026, 8, 31),
        parent_num=35,
    ))

    # --- Epic 6: Marketing & Distribution (mixed) ---
    session.add(_issue(46, itid_epic, sid_in_progress,
        "Marketing & Distribution",
        pct=15, milestone_id=msid_release,
        planned_start=date(2026, 4, 1), planned_end=date(2026, 9, 30),
        actual_start=date(2026, 4, 1),
        assignee_id=uid_orson, rag="green",
    ))
    session.add(_issue(47, itid_story, sid_in_progress,
        "Teaser trailer production — 90 sec",
        assignee_id=uid_orson, story_points=20, est_hours=40,
        pct=60, milestone_id=msid_release,
        planned_start=date(2026, 4, 5), planned_end=date(2026, 4, 30),
        actual_start=date(2026, 4, 10),
        parent_num=46,
    ))
    session.add(_issue(48, itid_story, sid_backlog,
        "Official trailer production — 2:30",
        assignee_id=uid_orson, story_points=25, est_hours=60,
        pct=0, milestone_id=msid_release,
        planned_start=date(2026, 8, 1), planned_end=date(2026, 8, 20),
        parent_num=46,
    ))
    session.add(_issue(49, itid_task, sid_backlog,
        "Press kit & EPK creation",
        assignee_id=uid_irene, est_hours=24,
        pct=0, milestone_id=msid_release,
        planned_start=date(2026, 8, 15), planned_end=date(2026, 9, 1),
        parent_num=46,
    ))
    session.add(_issue(50, itid_story, sid_backlog,
        "Festival submission strategy — TIFF, Venice, NYFF",
        assignee_id=uid_billy, story_points=15, est_hours=20,
        pct=0, milestone_id=msid_festival,
        planned_start=date(2026, 7, 1), planned_end=date(2026, 8, 1),
        parent_num=46,
    ))
    session.add(_issue(51, itid_task, sid_in_progress,
        "Social media campaign — launch phased rollout",
        assignee_id=uid_hedy, est_hours=40,
        pct=25, milestone_id=msid_release,
        planned_start=date(2026, 4, 15), planned_end=date(2026, 9, 30),
        actual_start=date(2026, 4, 20),
        parent_num=46,
    ))
    session.add(_issue(52, itid_task, sid_blocked,
        "Theatrical distribution deal negotiation",
        assignee_id=uid_cary, est_hours=60, priority="high",
        pct=10, milestone_id=msid_release,
        planned_start=date(2026, 4, 1), planned_end=date(2026, 6, 30),
        actual_start=date(2026, 4, 5),
        parent_num=46, rag="red",
    ))
    session.add(_issue(53, itid_task, sid_in_progress,
        "Poster & key art design — 3 concepts",
        assignee_id=uid_orson, est_hours=30,
        pct=50, milestone_id=msid_release,
        planned_start=date(2026, 4, 10), planned_end=date(2026, 5, 10),
        actual_start=date(2026, 4, 12),
        parent_num=46,
    ))
    session.add(_issue(54, itid_story, sid_backlog,
        "Press junket & premiere event planning",
        assignee_id=uid_irene, story_points=20, est_hours=40,
        pct=0, milestone_id=msid_release,
        planned_start=date(2026, 8, 15), planned_end=date(2026, 9, 15),
        parent_num=46,
    ))

    # --- Subtasks ---
    session.add(_issue(55, itid_subtask, sid_in_progress,
        "Scout backup rain locations",
        assignee_id=uid_ralph, est_hours=8,
        pct=40,
        planned_start=date(2026, 3, 29), planned_end=date(2026, 4, 2),
        actual_start=date(2026, 3, 30),
        parent_num=20,
    ))
    session.add(_issue(56, itid_subtask, sid_ready,
        "Hire background extras — 50 people",
        assignee_id=uid_irene, est_hours=12,
        pct=0,
        planned_start=date(2026, 4, 1), planned_end=date(2026, 4, 5),
        parent_num=20,
    ))
    session.add(_issue(57, itid_subtask, sid_done,
        "Secure parking for crew vehicles",
        assignee_id=uid_irene, est_hours=4,
        pct=100,
        planned_start=date(2026, 3, 28), planned_end=date(2026, 3, 29),
        actual_start=date(2026, 3, 28), actual_end=date(2026, 3, 29),
        parent_num=20,
    ))
    session.add(_issue(58, itid_subtask, sid_backlog,
        "Green screen keying review — Shots 1-20",
        assignee_id=uid_hedy, est_hours=24,
        pct=0,
        planned_start=date(2026, 7, 5), planned_end=date(2026, 7, 15),
        parent_num=38,
    ))
    session.add(_issue(59, itid_subtask, sid_backlog,
        "Matte painting — 1940s cityscape",
        assignee_id=uid_hedy, est_hours=40,
        pct=0,
        planned_start=date(2026, 7, 10), planned_end=date(2026, 7, 25),
        parent_num=38,
    ))
    session.add(_issue(60, itid_subtask, sid_backlog,
        "Wire removal — chase sequence",
        assignee_id=uid_hedy, est_hours=16,
        pct=0,
        planned_start=date(2026, 7, 15), planned_end=date(2026, 7, 22),
        parent_num=38,
    ))
    session.add(_issue(61, itid_subtask, sid_done,
        "Select temp music tracks",
        assignee_id=uid_billy, est_hours=6,
        pct=100,
        planned_start=date(2026, 4, 14), planned_end=date(2026, 4, 16),
        actual_start=date(2026, 4, 14), actual_end=date(2026, 4, 16),
        parent_num=47,
    ))
    session.add(_issue(62, itid_subtask, sid_done,
        "Dress set with period props",
        assignee_id=uid_orson, est_hours=16,
        pct=100,
        planned_start=date(2026, 3, 13), planned_end=date(2026, 3, 15),
        actual_start=date(2026, 3, 13), actual_end=date(2026, 3, 14),
        parent_num=19,
    ))

    await session.flush()
    logger.info("Created 62 issues")

    # ── Project Issue Counter ────────────────────────────────────────
    session.add(ProjectIssueCounter(project_id=pid, prefix="HGF", next_number=63))
    await session.flush()
    logger.info("Set project issue counter to 63")

    # ── Issue Labels ─────────────────────────────────────────────────
    label_assignments = [
        # Epic 1 children
        {"issue_id": iid[2], "label_id": lid_preprod},
        {"issue_id": iid[3], "label_id": lid_preprod},
        {"issue_id": iid[4], "label_id": lid_preprod},
        {"issue_id": iid[5], "label_id": lid_preprod},
        {"issue_id": iid[5], "label_id": lid_legal},
        {"issue_id": iid[6], "label_id": lid_preprod},
        {"issue_id": iid[6], "label_id": lid_legal},
        {"issue_id": iid[7], "label_id": lid_preprod},
        {"issue_id": iid[8], "label_id": lid_preprod},
        {"issue_id": iid[8], "label_id": lid_legal},
        # Epic 2 children
        {"issue_id": iid[10], "label_id": lid_preprod},
        {"issue_id": iid[10], "label_id": lid_location},
        {"issue_id": iid[11], "label_id": lid_preprod},
        {"issue_id": iid[11], "label_id": lid_location},
        {"issue_id": iid[12], "label_id": lid_preprod},
        {"issue_id": iid[13], "label_id": lid_casting},
        {"issue_id": iid[14], "label_id": lid_casting},
        {"issue_id": iid[15], "label_id": lid_preprod},
        {"issue_id": iid[16], "label_id": lid_preprod},
        {"issue_id": iid[17], "label_id": lid_preprod},
        # Epic 3 children
        {"issue_id": iid[19], "label_id": lid_photo},
        {"issue_id": iid[20], "label_id": lid_photo},
        {"issue_id": iid[21], "label_id": lid_photo},
        {"issue_id": iid[22], "label_id": lid_photo},
        {"issue_id": iid[23], "label_id": lid_photo},
        {"issue_id": iid[24], "label_id": lid_photo},
        {"issue_id": iid[24], "label_id": lid_urgent},
        {"issue_id": iid[24], "label_id": lid_sound},
        {"issue_id": iid[25], "label_id": lid_photo},
        {"issue_id": iid[26], "label_id": lid_photo},
        # Epic 4 children
        {"issue_id": iid[28], "label_id": lid_photo},
        {"issue_id": iid[29], "label_id": lid_photo},
        {"issue_id": iid[30], "label_id": lid_photo},
        {"issue_id": iid[30], "label_id": lid_location},
        {"issue_id": iid[31], "label_id": lid_photo},
        {"issue_id": iid[32], "label_id": lid_photo},
        {"issue_id": iid[33], "label_id": lid_photo},
        {"issue_id": iid[34], "label_id": lid_photo},
        # Epic 5 children
        {"issue_id": iid[36], "label_id": lid_postprod},
        {"issue_id": iid[37], "label_id": lid_postprod},
        {"issue_id": iid[38], "label_id": lid_postprod},
        {"issue_id": iid[38], "label_id": lid_vfx},
        {"issue_id": iid[39], "label_id": lid_postprod},
        {"issue_id": iid[39], "label_id": lid_sound},
        {"issue_id": iid[40], "label_id": lid_postprod},
        {"issue_id": iid[40], "label_id": lid_sound},
        {"issue_id": iid[41], "label_id": lid_postprod},
        {"issue_id": iid[42], "label_id": lid_postprod},
        {"issue_id": iid[43], "label_id": lid_postprod},
        {"issue_id": iid[44], "label_id": lid_postprod},
        {"issue_id": iid[45], "label_id": lid_postprod},
        # VFX subtasks
        {"issue_id": iid[58], "label_id": lid_vfx},
        {"issue_id": iid[59], "label_id": lid_vfx},
        {"issue_id": iid[60], "label_id": lid_vfx},
        # Epic 6 children
        {"issue_id": iid[47], "label_id": lid_marketing},
        {"issue_id": iid[47], "label_id": lid_client_facing},
        {"issue_id": iid[48], "label_id": lid_marketing},
        {"issue_id": iid[48], "label_id": lid_client_facing},
        {"issue_id": iid[49], "label_id": lid_marketing},
        {"issue_id": iid[50], "label_id": lid_marketing},
        {"issue_id": iid[51], "label_id": lid_marketing},
        {"issue_id": iid[52], "label_id": lid_marketing},
        {"issue_id": iid[53], "label_id": lid_marketing},
        {"issue_id": iid[53], "label_id": lid_client_facing},
        {"issue_id": iid[54], "label_id": lid_marketing},
    ]
    await session.execute(insert(issue_labels).values(label_assignments))
    await session.flush()
    logger.info("Assigned labels to issues")

    # ── Issue Links ──────────────────────────────────────────────────
    links_data = [
        (iid[19], iid[20], IssueLinkType.BLOCKS),
        (iid[20], iid[21], IssueLinkType.BLOCKS),
        (iid[20], iid[28], IssueLinkType.BLOCKS),
        (iid[32], iid[36], IssueLinkType.BLOCKS),
        (iid[36], iid[38], IssueLinkType.BLOCKS),
        (iid[38], iid[37], IssueLinkType.BLOCKS),
        (iid[37], iid[43], IssueLinkType.BLOCKS),
        (iid[43], iid[44], IssueLinkType.BLOCKS),
        (iid[37], iid[48], IssueLinkType.BLOCKS),
        (iid[47], iid[36], IssueLinkType.RELATES_TO),
    ]
    for src, tgt, lt in links_data:
        session.add(IssueLink(
            source_issue_id=src,
            target_issue_id=tgt,
            link_type=lt,
            created_by=uid_dev,
        ))
    await session.flush()
    logger.info("Created 10 issue links")

    # ── Comments ─────────────────────────────────────────────────────
    comments_data = [
        # HGF-24 (audio sync drift)
        (iid[24], uid_gene,
         "Analyzed the timecode logs — drift starts at TC 14:23:08. Appears to be a crystal sync issue with the wireless receiver on channel 3."),
        (iid[24], uid_howard,
         "Can we fix in post with a manual sync adjustment? We need these scenes for the rough cut."),
        (iid[24], uid_gene,
         "Already pulled the backup boom mic tracks. Re-syncing now. Should have clean audio by tomorrow."),
        (iid[24], uid_rosalind,
         "Good catch. Let's add a dual-system check to the daily workflow going forward."),
        # HGF-20 (courthouse exteriors)
        (iid[20], uid_ralph,
         "Weather forecast shows rain Tuesday through Thursday. Recommend we flip to interior coverage for courthouse lobby scenes."),
        (iid[20], uid_rosalind,
         "Agreed. Let's shoot the jail corridor and clerk's office interiors on the rain days. Grip team, please prep for the hallway setup."),
        (iid[20], uid_irene,
         "Updated the shooting schedule. Exterior days moved to Friday-Monday. Permit extension approved."),
        # HGF-47 (teaser trailer)
        (iid[47], uid_orson,
         "First cut is at 94 seconds. The newsroom montage opens strong but the pacing drops in the middle third."),
        (iid[47], uid_billy,
         "Temp music isn't working for the rapid-fire dialogue scenes. We need something with more rhythmic energy — jazz combo maybe?"),
        (iid[47], uid_cary,
         "Studio wants to see the teaser by end of month. Can we get a locked cut by next Friday?"),
        # HGF-52 (distribution deal - blocked)
        (iid[52], uid_cary,
         "Paramount wants first-look window exclusivity for 90 days. That conflicts with our streaming deal timeline."),
        (iid[52], uid_gene,
         "Legal is reviewing the clause. We may need to push the streaming window to Q1 2027."),
        (iid[52], uid_rosalind,
         "Let's schedule a call with their VP of acquisitions to see if we can negotiate a 60-day window instead."),
        # HGF-22 (stunt coordination)
        (iid[22], uid_hedy,
         "Stunt viz complete for the rooftop sequence. 14 individual gags across 3 camera setups."),
        (iid[22], uid_rosalind,
         "Safety review passed. Wire team needs 2 additional rehearsal days before we shoot."),
        (iid[22], uid_howard,
         "I'll schedule the rehearsal days for next Tuesday and Wednesday. Sound team, we'll need wind screens for the rooftop mics."),
        # HGF-25 (continuity error)
        (iid[25], uid_howard,
         "Script supervisor flagged this in the day 10 report. Walter enters the courthouse wearing a fedora in the wide shot but it's gone in the close-up."),
        (iid[25], uid_irene,
         "Found the hat in the prop truck. We can do a quick pick-up during lunch break tomorrow."),
        (iid[25], uid_rosalind,
         "Let's also add a continuity checklist to the daily call sheet. This is the second wardrobe issue this week."),
        # HGF-51 (social media campaign)
        (iid[51], uid_hedy,
         "Phase 1 content calendar drafted — focusing on behind-the-scenes production stills and short crew interviews."),
        (iid[51], uid_orson,
         "Let's make sure none of the BTS photos reveal any plot details. Studio PR has strict spoiler guidelines."),
        (iid[51], uid_cary,
         "Social engagement metrics from comparable films suggest we should start the campaign 5 months before release. We're right on schedule."),
    ]
    for c_issue_id, c_author_id, c_text in comments_data:
        session.add(IssueComment(
            issue_id=c_issue_id,
            author_id=c_author_id,
            content=c_text,
            content_text=c_text,
            is_deleted=False,
        ))
    await session.flush()
    logger.info("Created 22 comments")

    # ── Budget ───────────────────────────────────────────────────────
    session.add(ProjectBudget(
        project_id=pid,
        total_budget=12500000.0,
        currency="USD",
        notes=(
            "Production budget approved by Victoria Sterling, Paramount Pictures. "
            "Contingency reserve: 8%."
        ),
    ))
    await session.flush()

    cost_entries_data = [
        (CostCategory.labor, 850000.0, "Above-the-line talent — lead cast", date(2026, 1, 15)),
        (CostCategory.labor, 620000.0, "Above-the-line talent — supporting cast", date(2026, 2, 1)),
        (CostCategory.labor, 480000.0, "Director and key creative team", date(2026, 1, 10)),
        (CostCategory.labor, 380000.0, "Production crew — Block A", date(2026, 3, 15)),
        (CostCategory.labor, 350000.0, "Production crew — Block B", date(2026, 4, 28)),
        (CostCategory.labor, 275000.0, "Post-production editorial team", date(2026, 6, 16)),
        (CostCategory.labor, 180000.0, "VFX artists and supervisors", date(2026, 7, 1)),
        (CostCategory.labor, 120000.0, "Sound design and mixing team", date(2026, 7, 15)),
        (CostCategory.labor, 95000.0, "Marketing and PR team", date(2026, 4, 1)),
        (CostCategory.hardware, 420000.0, "Camera package — ARRI Alexa 35 rental", date(2026, 3, 1)),
        (CostCategory.hardware, 185000.0, "Lighting and grip equipment rental", date(2026, 3, 5)),
        (CostCategory.hardware, 95000.0, "Sound recording equipment", date(2026, 3, 10)),
        (CostCategory.hardware, 65000.0, "Drone and Steadicam packages", date(2026, 3, 12)),
        (CostCategory.software, 45000.0, "DaVinci Resolve Studio licenses", date(2026, 1, 15)),
        (CostCategory.software, 38000.0, "Pro Tools and sound design plugins", date(2026, 1, 15)),
        (CostCategory.software, 120000.0, "VFX software licenses — Nuke, Houdini, Maya", date(2026, 6, 1)),
        (CostCategory.travel, 280000.0, "NYC location expenses — permits, security, logistics", date(2026, 3, 15)),
        (CostCategory.travel, 195000.0, "Chicago location expenses", date(2026, 4, 1)),
        (CostCategory.travel, 85000.0, "Cast and crew travel — NYC to Chicago", date(2026, 4, 15)),
        (CostCategory.travel, 45000.0, "Festival travel — TIFF submission trip", date(2026, 9, 1)),
        (CostCategory.consulting, 150000.0, "Legal — contracts, rights clearance, distribution", date(2026, 1, 5)),
        (CostCategory.consulting, 75000.0, "Historical accuracy consultant", date(2026, 1, 10)),
        (CostCategory.consulting, 60000.0, "Stunt coordinator and safety team", date(2026, 3, 20)),
        (CostCategory.other, 1800000.0, "Production design — set construction and dressing", date(2026, 2, 1)),
        (CostCategory.other, 450000.0, "Original score — composer fee and orchestra recording", date(2026, 7, 1)),
    ]
    for c_cat, c_amt, c_desc, c_date in cost_entries_data:
        session.add(CostEntry(
            project_id=pid,
            category=c_cat,
            amount=c_amt,
            description=c_desc,
            entry_date=c_date,
        ))
    await session.flush()
    logger.info("Created budget and 25 cost entries")

    # ── Stakeholders ─────────────────────────────────────────────────
    stakeholders_data = [
        ("Victoria Sterling", "Executive Producer", "victoria@paramount.local",
         "Paramount Pictures", 5, 5,
         "Weekly status reports, gate approval sign-offs, budget variance reviews",
         "Primary budget authority and greenlight decision maker"),
        ("James Chen", "Studio Head of Production", "james.chen@paramount.local",
         "Paramount Pictures", 4, 5,
         "Monthly executive briefings, final cut approval",
         "Final creative authority on behalf of the studio"),
        ("Maria Santos", "Head of Distribution", "maria.santos@paramount.local",
         "Paramount Pictures", 4, 4,
         "Quarterly release planning, distribution strategy reviews",
         "Oversees theatrical and streaming distribution deals"),
        ("David Kim", "VP Marketing", "david.kim@paramount.local",
         "Paramount Pictures", 4, 4,
         "Bi-weekly creative reviews, campaign milestone approvals",
         "Leads marketing strategy and campaign execution"),
        ("Sarah O'Brien", "NYC Film Commission Liaison", "sarah.obrien@nyfilm.local",
         "NYC Film Commission", 3, 3,
         "Permit coordination, location approval sign-offs, community liaison",
         "Key contact for all NYC filming permits and logistics"),
        ("Tom Nakamura", "VFX Supervisor", "tom.nakamura@ilm.local",
         "Industrial Light & Magic", 5, 3,
         "Sprint-based VFX pipeline reviews, shot approval sessions",
         "External VFX vendor lead for all 84 compositing shots"),
        ("Elena Vasquez", "Music Supervisor", "elena.vasquez@music.local",
         "Independent", 4, 3,
         "Monthly music review sessions, spotting session attendance",
         "Oversees score composition and music licensing"),
        ("Robert Liu", "Production Accountant", "robert.liu@accounting.local",
         "Liu & Associates", 5, 4,
         "Weekly budget monitoring, cash flow projections, cost report review",
         "Responsible for all financial tracking and reporting"),
        ("Angela Morrison", "Casting Director", "angela.morrison@casting.local",
         "Morrison Casting", 3, 3,
         "Casting session scheduling, talent availability coordination",
         "External casting agency lead"),
        ("Frank Capra III", "Script Consultant", "frank.capra@consultant.local",
         "Independent", 4, 2,
         "Script review rounds, historical accuracy consultation",
         "Specialist in classic Hollywood era journalism films"),
        ("Nina Petrova", "Costume Designer", "nina.petrova@costume.local",
         "Independent", 4, 2,
         "Fitting schedule, fabric sourcing approvals, on-set alterations",
         "Lead costume designer for period-modern hybrid aesthetic"),
        ("Liam O'Donnell", "Stunt Coordinator", "liam.odonnell@stunts.local",
         "O'Donnell Action Design", 5, 3,
         "Safety briefings, stunt rehearsal scheduling, risk assessments",
         "Coordinates all action sequences and safety protocols"),
    ]
    for s_name, s_role, s_email, s_org, s_interest, s_influence, s_strategy, s_notes in stakeholders_data:
        session.add(Stakeholder(
            project_id=pid,
            name=s_name,
            role=s_role,
            email=s_email,
            organization_name=s_org,
            interest_level=s_interest,
            influence_level=s_influence,
            engagement_strategy=s_strategy,
            notes=s_notes,
            is_deleted=False,
        ))
    await session.flush()
    logger.info("Created 12 stakeholders")

    # ── RACI Assignments ─────────────────────────────────────────────
    raci_data = [
        # Project-level
        (None, uid_dev, RACIRoleType.ACCOUNTABLE),
        (None, uid_rosalind, RACIRoleType.RESPONSIBLE),
        (None, uid_cary, RACIRoleType.CONSULTED),
        (None, uid_howard, RACIRoleType.INFORMED),
        # Epic-level
        (iid[1], uid_rosalind, RACIRoleType.RESPONSIBLE),
        (iid[1], uid_dev, RACIRoleType.ACCOUNTABLE),
        (iid[1], uid_billy, RACIRoleType.CONSULTED),
        (iid[1], uid_gene, RACIRoleType.INFORMED),
        (iid[9], uid_cary, RACIRoleType.RESPONSIBLE),
        (iid[9], uid_dev, RACIRoleType.ACCOUNTABLE),
        (iid[9], uid_irene, RACIRoleType.CONSULTED),
        (iid[9], uid_ralph, RACIRoleType.INFORMED),
        (iid[18], uid_rosalind, RACIRoleType.RESPONSIBLE),
        (iid[18], uid_dev, RACIRoleType.ACCOUNTABLE),
        (iid[18], uid_ralph, RACIRoleType.CONSULTED),
        (iid[18], uid_howard, RACIRoleType.INFORMED),
        (iid[27], uid_rosalind, RACIRoleType.RESPONSIBLE),
        (iid[27], uid_dev, RACIRoleType.ACCOUNTABLE),
        (iid[27], uid_hedy, RACIRoleType.CONSULTED),
        (iid[27], uid_gene, RACIRoleType.INFORMED),
        (iid[35], uid_howard, RACIRoleType.RESPONSIBLE),
        (iid[35], uid_dev, RACIRoleType.ACCOUNTABLE),
        (iid[35], uid_gene, RACIRoleType.CONSULTED),
        (iid[35], uid_rosalind, RACIRoleType.INFORMED),
        (iid[46], uid_orson, RACIRoleType.RESPONSIBLE),
        (iid[46], uid_dev, RACIRoleType.ACCOUNTABLE),
        (iid[46], uid_cary, RACIRoleType.CONSULTED),
        (iid[46], uid_billy, RACIRoleType.INFORMED),
        # Key issue-level
        (iid[24], uid_gene, RACIRoleType.RESPONSIBLE),
        (iid[24], uid_howard, RACIRoleType.ACCOUNTABLE),
        (iid[38], uid_hedy, RACIRoleType.RESPONSIBLE),
        (iid[38], uid_rosalind, RACIRoleType.ACCOUNTABLE),
        (iid[38], uid_orson, RACIRoleType.CONSULTED),
        (iid[47], uid_orson, RACIRoleType.RESPONSIBLE),
        (iid[47], uid_cary, RACIRoleType.ACCOUNTABLE),
        (iid[47], uid_billy, RACIRoleType.CONSULTED),
    ]
    for r_issue_id, r_user_id, r_role in raci_data:
        session.add(RACIAssignment(
            project_id=pid,
            issue_id=r_issue_id,
            user_id=r_user_id,
            role_type=r_role,
        ))
    await session.flush()
    logger.info("Created 36 RACI assignments")

    # ── Time Entries ─────────────────────────────────────────────────
    time_entries_data = [
        # HGF-2 (screenplay draft)
        (iid[2], uid_rosalind, 8.0, date(2026, 1, 8), "Initial outline and treatment"),
        (iid[2], uid_rosalind, 10.0, date(2026, 1, 10), "Act 1 draft"),
        (iid[2], uid_rosalind, 12.0, date(2026, 1, 14), "Act 2 draft"),
        (iid[2], uid_rosalind, 8.0, date(2026, 1, 17), "Act 3 draft"),
        (iid[2], uid_rosalind, 6.0, date(2026, 1, 21), "First revision pass"),
        # HGF-3 (table read)
        (iid[3], uid_cary, 6.0, date(2026, 1, 27), "Table read session with principal cast"),
        (iid[3], uid_rosalind, 4.0, date(2026, 1, 27), "Table read — note-taking and observations"),
        (iid[3], uid_cary, 4.0, date(2026, 1, 28), "Table read debrief and notes compilation"),
        # HGF-4 (finalize screenplay)
        (iid[4], uid_rosalind, 10.0, date(2026, 2, 1), "Incorporate studio notes — Acts 1-2"),
        (iid[4], uid_rosalind, 8.0, date(2026, 2, 5), "Incorporate studio notes — Act 3"),
        (iid[4], uid_rosalind, 6.0, date(2026, 2, 10), "Final polish pass"),
        # HGF-6 (IP clearance)
        (iid[6], uid_gene, 8.0, date(2026, 1, 8), "Rights research — original film"),
        (iid[6], uid_gene, 10.0, date(2026, 1, 15), "Negotiate underlying rights with estate"),
        (iid[6], uid_gene, 6.0, date(2026, 1, 28), "Finalize clearance documentation"),
        # HGF-7 (1940s research)
        (iid[7], uid_billy, 8.0, date(2026, 1, 6), "Library research — period journalism"),
        (iid[7], uid_billy, 6.0, date(2026, 1, 12), "Interview with journalism historian"),
        (iid[7], uid_billy, 4.0, date(2026, 1, 16), "Compile reference document for production"),
        # HGF-10 (NYC scouting)
        (iid[10], uid_ralph, 10.0, date(2026, 2, 3), "Scouted 3 potential newsroom locations in Manhattan"),
        (iid[10], uid_ralph, 8.0, date(2026, 2, 5), "Courthouse and jail exterior survey — Lower Manhattan"),
        (iid[10], uid_irene, 6.0, date(2026, 2, 6), "Permit feasibility assessment for preferred locations"),
        (iid[10], uid_ralph, 6.0, date(2026, 2, 10), "Restaurant and apartment location survey — Upper West Side"),
        # HGF-11 (Chicago scouting)
        (iid[11], uid_ralph, 8.0, date(2026, 2, 12), "Tribune Tower area survey"),
        (iid[11], uid_ralph, 6.0, date(2026, 2, 14), "Chicago City Hall and Daley Plaza scouting"),
        # HGF-13 (casting leads)
        (iid[13], uid_cary, 8.0, date(2026, 2, 10), "Audition session — Hildy candidates (12 actors)"),
        (iid[13], uid_cary, 6.0, date(2026, 2, 12), "Chemistry reads — top 3 pairs"),
        (iid[13], uid_cary, 4.0, date(2026, 2, 14), "Final casting decision meeting with director"),
        # HGF-14 (casting supporting)
        (iid[14], uid_cary, 8.0, date(2026, 2, 18), "Supporting cast auditions — batch 1"),
        (iid[14], uid_cary, 6.0, date(2026, 2, 22), "Supporting cast auditions — batch 2"),
        (iid[14], uid_cary, 4.0, date(2026, 2, 25), "Final selections and offer negotiations"),
        # HGF-15 (costume design)
        (iid[15], uid_irene, 8.0, date(2026, 2, 1), "Research — 1940s fashion reference compilation"),
        (iid[15], uid_irene, 10.0, date(2026, 2, 8), "Concept sketches — lead characters"),
        (iid[15], uid_irene, 6.0, date(2026, 2, 15), "Fabric sourcing and fitting prep"),
        # HGF-16 (newsroom set build)
        (iid[16], uid_orson, 10.0, date(2026, 2, 5), "Initial set design concepts"),
        (iid[16], uid_orson, 12.0, date(2026, 2, 10), "Detailed blueprints and material sourcing"),
        (iid[16], uid_orson, 8.0, date(2026, 2, 18), "Construction supervision — day 1"),
        (iid[16], uid_orson, 8.0, date(2026, 2, 25), "Construction supervision — week 2"),
        (iid[16], uid_orson, 6.0, date(2026, 3, 5), "Final dressing and walkthrough"),
        # HGF-19 (newsroom scenes)
        (iid[19], uid_rosalind, 14.0, date(2026, 3, 17), "Day 1 — Newsroom master shots and coverage"),
        (iid[19], uid_howard, 12.0, date(2026, 3, 17), "Day 1 — Onset editing review"),
        (iid[19], uid_gene, 12.0, date(2026, 3, 17), "Day 1 — Sound recording"),
        (iid[19], uid_ralph, 14.0, date(2026, 3, 17), "Day 1 — Camera operation"),
        (iid[19], uid_rosalind, 12.0, date(2026, 3, 18), "Day 2 — Newsroom dialogue scenes"),
        (iid[19], uid_rosalind, 14.0, date(2026, 3, 19), "Day 3 — Newsroom action sequence"),
        (iid[19], uid_ralph, 10.0, date(2026, 3, 20), "Day 4 — Closeups and inserts"),
        # HGF-20 (courthouse)
        (iid[20], uid_rosalind, 14.0, date(2026, 4, 1), "Courthouse exterior — establishing shots"),
        (iid[20], uid_ralph, 14.0, date(2026, 4, 1), "Camera — wide and medium setups"),
        (iid[20], uid_rosalind, 12.0, date(2026, 4, 2), "Courthouse steps — dialogue scene"),
        (iid[20], uid_irene, 6.0, date(2026, 4, 3), "Schedule coordination with location office"),
        # HGF-22 (stunts)
        (iid[22], uid_hedy, 8.0, date(2026, 3, 25), "Pre-viz planning session"),
        (iid[22], uid_hedy, 10.0, date(2026, 3, 28), "Wire rig setup and testing"),
        (iid[22], uid_hedy, 12.0, date(2026, 4, 5), "Rehearsal with stunt doubles"),
        # HGF-47 (teaser trailer)
        (iid[47], uid_orson, 8.0, date(2026, 4, 10), "Select footage for trailer edit"),
        (iid[47], uid_orson, 10.0, date(2026, 4, 12), "First rough cut assembly"),
        (iid[47], uid_orson, 6.0, date(2026, 4, 15), "Revisions based on producer feedback"),
        (iid[47], uid_billy, 4.0, date(2026, 4, 16), "Temp score selection for trailer"),
        # HGF-51 (social media)
        (iid[51], uid_hedy, 6.0, date(2026, 4, 20), "Content calendar draft"),
        (iid[51], uid_hedy, 4.0, date(2026, 4, 25), "Behind-the-scenes photo selection"),
        # HGF-53 (poster design)
        (iid[53], uid_orson, 8.0, date(2026, 4, 14), "Initial concept sketches"),
        (iid[53], uid_orson, 6.0, date(2026, 4, 20), "Concept refinement — top 3 directions"),
        # HGF-62 (dress set)
        (iid[62], uid_orson, 8.0, date(2026, 3, 13), "Source and arrange period props"),
        (iid[62], uid_orson, 8.0, date(2026, 3, 14), "Final set dressing walkthrough"),
        # HGF-8 (copyright bug)
        (iid[8], uid_gene, 6.0, date(2026, 1, 15), "Identify copyrighted headline issues"),
        (iid[8], uid_gene, 4.0, date(2026, 1, 18), "Replace with cleared prop headlines"),
        # HGF-26 (weather contingency)
        (iid[26], uid_irene, 4.0, date(2026, 3, 10), "Draft weather contingency protocol"),
        (iid[26], uid_irene, 4.0, date(2026, 3, 12), "Finalize backup schedule with department heads"),
        # HGF-17 (union conflict)
        (iid[17], uid_howard, 4.0, date(2026, 2, 21), "Meeting with union rep"),
        (iid[17], uid_howard, 4.0, date(2026, 2, 23), "Revised crew schedule submitted"),
        # HGF-12 (permits)
        (iid[12], uid_irene, 8.0, date(2026, 2, 16), "Permit applications — NYC"),
        (iid[12], uid_irene, 6.0, date(2026, 2, 20), "Permit applications — Chicago"),
        (iid[12], uid_irene, 4.0, date(2026, 2, 25), "Follow-up and confirmations"),
    ]
    for te_issue, te_user, te_hours, te_date, te_desc in time_entries_data:
        session.add(TimeEntry(
            issue_id=te_issue,
            user_id=te_user,
            hours=te_hours,
            date=te_date,
            description=te_desc,
        ))
    await session.flush()
    logger.info("Created %d time entries", len(time_entries_data))

    # ── Automation Rules ─────────────────────────────────────────────
    automations_data = [
        (
            "Auto-assign reviews to Howard",
            TriggerType.STATUS_CHANGED,
            {"to_status": "In Review"},
            None,
            ActionType.CHANGE_ASSIGNEE,
            {"assignee_id": str(uid_howard)},
        ),
        (
            "Flag approaching deadlines",
            TriggerType.DUE_DATE_APPROACHING,
            {"days_before": 3},
            None,
            ActionType.CHANGE_PRIORITY,
            {"priority": "high"},
        ),
        (
            "Notify lead on new issues",
            TriggerType.ISSUE_CREATED,
            {},
            None,
            ActionType.SEND_NOTIFICATION,
            {"user_id": str(uid_dev), "message": "New issue created"},
        ),
        (
            "Label resolved bugs",
            TriggerType.STATUS_CHANGED,
            {"to_status": "Done"},
            {"issue_type": "Bug"},
            ActionType.ADD_LABEL,
            {"label_name": "Resolved"},
        ),
        (
            "Escalate critical issues",
            TriggerType.PRIORITY_CHANGED,
            {"to_priority": "critical"},
            None,
            ActionType.ADD_COMMENT,
            {
                "comment": (
                    "ESCALATED: This issue has been flagged as critical and "
                    "requires immediate attention from the production lead."
                )
            },
        ),
        (
            "Notify on milestone status",
            TriggerType.STATUS_CHANGED,
            {},
            {"has_milestone": True},
            ActionType.SEND_NOTIFICATION,
            {"message": "Milestone-linked issue status changed"},
        ),
    ]
    for a_name, a_trigger, a_trigger_cfg, a_cond_cfg, a_action, a_action_cfg in automations_data:
        session.add(AutomationRule(
            project_id=pid,
            name=a_name,
            is_enabled=True,
            trigger_type=a_trigger,
            trigger_config=a_trigger_cfg,
            condition_config=a_cond_cfg,
            action_type=a_action,
            action_config=a_action_cfg,
            execution_count=0,
        ))
    await session.flush()
    logger.info("Created 6 automation rules")

    # ── Decisions ────────────────────────────────────────────────────
    decisions_data = [
        (
            "Camera system: ARRI Alexa 35 vs RED V-Raptor",
            "Evaluate primary camera package for production based on image quality, workflow compatibility, and reliability.",
            DecisionStatus.DECIDED,
            date(2026, 1, 12),
            "Selected ARRI Alexa 35 for superior color science and reliability on location.",
            (
                "The Alexa 35's Open Gate mode and built-in ND filters give us maximum flexibility "
                "for both studio and location work. RED's higher resolution doesn't justify the "
                "additional post-production overhead for a dialogue-heavy film."
            ),
        ),
        (
            "Primary location: NYC vs Atlanta for newsroom scenes",
            "Determine primary shooting location balancing production value against tax incentives.",
            DecisionStatus.DECIDED,
            date(2026, 1, 18),
            "NYC selected for authentic production value and architectural character.",
            (
                "While Atlanta offers tax incentives, the authentic NYC architecture and energy are "
                "essential to the film's identity. The 15% higher location costs are offset by "
                "reduced set construction needs."
            ),
        ),
        (
            "Release window: Summer vs Fall 2026",
            "Strategic release timing to maximize box office performance and awards season positioning.",
            DecisionStatus.DECIDED,
            date(2026, 2, 5),
            "Fall 2026 release — targeting late September.",
            (
                "Fall positions us for awards season consideration and avoids crowded summer "
                "blockbuster competition. The September window also aligns with TIFF premiere opportunity."
            ),
        ),
        (
            "Practical stunts vs full CGI for chase sequence",
            (
                "Evaluating whether the rooftop chase should use practical stunts with wire "
                "enhancement or full CGI replacement. Budget implication: $400K difference."
            ),
            DecisionStatus.UNDER_REVIEW,
            None,
            None,
            None,
        ),
        (
            "Score approach: Original orchestral vs licensed music",
            "Decide between commissioning an original score or licensing existing music for the film.",
            DecisionStatus.DECIDED,
            date(2026, 2, 20),
            "Original orchestral score with jazz elements.",
            (
                "An original score provides full creative control and avoids licensing complications "
                "for international distribution. Jazz instrumentation honors the 1940s setting "
                "while feeling contemporary."
            ),
        ),
        (
            "Festival premiere: TIFF vs Venice vs Telluride",
            (
                "Debating premiere venue. TIFF offers largest audience and market access. Venice "
                "provides prestige. Telluride offers intimate critical reception. Budget allows "
                "for one major premiere event."
            ),
            DecisionStatus.PROPOSED,
            None,
            None,
            None,
        ),
        (
            "Aspect ratio: 2.39:1 anamorphic vs 1.85:1 flat",
            "Choose the aspect ratio and lens system that best serves the film's visual storytelling.",
            DecisionStatus.DECIDED,
            date(2026, 1, 25),
            "2.39:1 anamorphic using Cooke S7/i lenses.",
            (
                "Anamorphic gives the film a cinematic scope appropriate for a theatrical release. "
                "The Cooke lenses provide beautiful bokeh and subtle flare characteristics that "
                "complement the period aesthetic."
            ),
        ),
    ]
    for d_title, d_desc, d_status, d_date, d_outcome, d_rationale in decisions_data:
        session.add(Decision(
            project_id=pid,
            title=d_title,
            description=d_desc,
            status=d_status,
            decided_date=d_date,
            outcome=d_outcome,
            rationale=d_rationale,
            is_deleted=False,
        ))
    await session.flush()
    logger.info("Created 7 decisions")

    # ── Commit everything ────────────────────────────────────────────
    await session.commit()
    logger.info("Demo project 'His Girl Friday' seeded successfully")


async def _main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    async with async_session_factory() as session:
        await seed_demo_project(session)


if __name__ == "__main__":
    asyncio.run(_main())
