from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.issue import Issue
from app.models.issue_relation import IssueLink, IssueLinkType
from app.models.schedule import ScheduleRun, ScheduleRunStatus

logger = structlog.get_logger()

# Default duration in working days when no estimate is provided
DEFAULT_DURATION_DAYS = 5
HOURS_PER_DAY = 8


def _build_dependency_graph(
    issues: list[Issue],
    links: list[IssueLink],
) -> tuple[dict[str, list[str]], dict[str, list[str]], set[str]]:
    """Build adjacency lists from issue links where link_type is 'blocks'.

    If A blocks B, then B depends on A: A must finish before B can start.

    Returns:
        predecessors: mapping of issue_id -> list of issue_ids that must finish first
        successors:   mapping of issue_id -> list of issue_ids that come after
        all_ids:      set of all issue IDs in the project
    """
    all_ids: set[str] = {str(issue.id) for issue in issues}
    predecessors: dict[str, list[str]] = defaultdict(list)
    successors: dict[str, list[str]] = defaultdict(list)

    for link in links:
        source = str(link.source_issue_id)
        target = str(link.target_issue_id)

        # "blocks" means source blocks target => target depends on source
        if source in all_ids and target in all_ids:
            predecessors[target].append(source)
            successors[source].append(target)

    return dict(predecessors), dict(successors), all_ids


def _topological_sort(
    all_ids: set[str],
    predecessors: dict[str, list[str]],
    successors: dict[str, list[str]],
) -> list[str]:
    """Kahn's algorithm for topological sort with cycle detection.

    Returns issue IDs in dependency order (predecessors before successors).

    Raises:
        ValueError: if a cycle is detected in the dependency graph.
    """
    in_degree: dict[str, int] = {nid: 0 for nid in all_ids}
    for nid in all_ids:
        for pred in predecessors.get(nid, []):
            in_degree[nid] += 1  # noqa: SIM113

    queue: deque[str] = deque()
    for nid in all_ids:
        if in_degree[nid] == 0:
            queue.append(nid)

    sorted_order: list[str] = []
    while queue:
        node = queue.popleft()
        sorted_order.append(node)
        for succ in successors.get(node, []):
            in_degree[succ] -= 1
            if in_degree[succ] == 0:
                queue.append(succ)

    if len(sorted_order) != len(all_ids):
        visited = set(sorted_order)
        cycle_members = [nid for nid in all_ids if nid not in visited]
        raise ValueError(
            f"Dependency cycle detected involving issues: {', '.join(cycle_members)}"
        )

    return sorted_order


def _compute_durations(issues: list[Issue]) -> dict[str, int]:
    """Compute duration in working days for each issue.

    Uses estimated_hours / 8 (rounded up) or DEFAULT_DURATION_DAYS.
    """
    durations: dict[str, int] = {}
    for issue in issues:
        if issue.estimated_hours and issue.estimated_hours > 0:
            days = max(1, -(-int(issue.estimated_hours) // HOURS_PER_DAY))  # ceil div
        else:
            days = DEFAULT_DURATION_DAYS
        durations[str(issue.id)] = days
    return durations


def _forward_pass(
    sorted_order: list[str],
    predecessors: dict[str, list[str]],
    durations: dict[str, int],
) -> dict[str, dict[str, int]]:
    """Forward-pass scheduling: compute earliest start and end for each issue.

    For each issue in topological order:
      - start = max(end of all predecessors) + 1  (day after latest predecessor finishes)
      - end   = start + duration - 1

    Day numbers are 1-based: day 1 is the first project day.

    Returns dict mapping issue_id -> {"start": int, "end": int}.
    """
    schedule: dict[str, dict[str, int]] = {}

    for nid in sorted_order:
        preds = predecessors.get(nid, [])
        if preds:
            earliest_start = max(schedule[p]["end"] for p in preds) + 1
        else:
            earliest_start = 1  # no predecessors: start on day 1

        duration = durations.get(nid, DEFAULT_DURATION_DAYS)
        schedule[nid] = {
            "start": earliest_start,
            "end": earliest_start + duration - 1,
        }

    return schedule


def _find_critical_path(
    sorted_order: list[str],
    predecessors: dict[str, list[str]],
    successors: dict[str, list[str]],
    schedule: dict[str, dict[str, int]],
) -> list[str]:
    """Identify the critical path: the longest path through the dependency graph.

    Uses backward pass to compute latest start times, then collects nodes
    where earliest_start == latest_start (zero slack).
    """
    if not sorted_order:
        return []

    # Find the project end day (maximum end across all tasks)
    project_end = max(s["end"] for s in schedule.values())

    # Backward pass: compute latest start and end for each issue
    latest: dict[str, dict[str, int]] = {}

    for nid in reversed(sorted_order):
        succs = successors.get(nid, [])
        if succs:
            latest_end = min(latest[s]["start"] for s in succs) - 1
        else:
            latest_end = project_end

        duration = schedule[nid]["end"] - schedule[nid]["start"] + 1
        latest[nid] = {
            "start": latest_end - duration + 1,
            "end": latest_end,
        }

    # Critical path: nodes where early start == late start (zero total float)
    critical_nodes = [
        nid
        for nid in sorted_order
        if schedule[nid]["start"] == latest[nid]["start"]
    ]

    # Build the actual longest chain by tracing through critical nodes
    # that are connected via predecessor/successor relationships
    critical_set = set(critical_nodes)
    # Find the chain: start from a critical node with no critical predecessors
    # and follow critical successors
    chains: list[list[str]] = []
    visited: set[str] = set()

    for nid in sorted_order:
        if nid not in critical_set or nid in visited:
            continue
        # Check if this node has any critical predecessor
        has_critical_pred = any(
            p in critical_set for p in predecessors.get(nid, [])
        )
        if has_critical_pred:
            continue

        # Trace forward from this root along critical successors
        chain: list[str] = []
        current = nid
        while current is not None:
            chain.append(current)
            visited.add(current)
            # Find the next critical successor
            next_node = None
            for succ in successors.get(current, []):
                if succ in critical_set and succ not in visited:
                    next_node = succ
                    break
            current = next_node

        chains.append(chain)

    # Return the longest chain found
    if chains:
        return max(chains, key=len)
    return critical_nodes


def _day_to_date(day_number: int, project_start: datetime) -> str:
    """Convert a 1-based day number to an ISO date string."""
    return (project_start + timedelta(days=day_number - 1)).strftime("%Y-%m-%d")


async def run_auto_schedule(ctx: dict, run_id: str, project_id: str) -> None:
    """ARQ task: auto-schedule all issues in a project using dependency graph analysis.

    Steps:
    1. Load all issues for the project and their blocking dependencies
    2. Build a dependency graph (adjacency list)
    3. Topological sort (detect cycles, fail gracefully)
    4. Forward-pass scheduling: compute start/end for each issue
    5. Identify the critical path (longest path through graph)
    6. Persist results to the ScheduleRun record
    """
    logger.info(
        "auto_schedule_started",
        run_id=run_id,
        project_id=project_id,
    )

    async with async_session_factory() as session:
        try:
            await _execute_schedule(session, run_id, project_id)
        except Exception as exc:
            logger.exception(
                "auto_schedule_failed",
                run_id=run_id,
                project_id=project_id,
                error=str(exc),
            )
            await _mark_failed(session, run_id, str(exc))


async def _execute_schedule(
    session: AsyncSession,
    run_id: str,
    project_id: str,
) -> None:
    """Core scheduling logic wrapped for error handling."""
    run_uuid = UUID(run_id)
    project_uuid = UUID(project_id)

    # Mark run as running
    run = await session.get(ScheduleRun, run_uuid)
    if not run:
        logger.error("schedule_run_not_found", run_id=run_id)
        return

    run.status = ScheduleRunStatus.running
    run.started_at = datetime.now(timezone.utc)
    await session.commit()

    # Load all issues for the project
    issues_result = await session.execute(
        select(Issue).where(
            Issue.project_id == project_uuid,
            Issue.is_deleted == False,  # noqa: E712
        )
    )
    issues = list(issues_result.scalars().all())

    if not issues:
        run.status = ScheduleRunStatus.completed
        run.completed_at = datetime.now(timezone.utc)
        run.result_json = {}
        run.critical_path_json = []
        await session.commit()
        logger.info("auto_schedule_completed_empty", run_id=run_id)
        return

    # Collect all issue IDs for this project
    issue_ids = [issue.id for issue in issues]

    # Load blocking links where both source and target are in this project
    links_result = await session.execute(
        select(IssueLink).where(
            IssueLink.link_type == IssueLinkType.BLOCKS,
            IssueLink.source_issue_id.in_(issue_ids),
            IssueLink.target_issue_id.in_(issue_ids),
        )
    )
    links = list(links_result.scalars().all())

    # Build the dependency graph
    predecessors, successors, all_ids = _build_dependency_graph(issues, links)

    # Topological sort (raises ValueError on cycle)
    sorted_order = _topological_sort(all_ids, predecessors, successors)

    # Compute durations per issue
    durations = _compute_durations(issues)

    # Forward-pass scheduling
    schedule = _forward_pass(sorted_order, predecessors, durations)

    # Find the critical path
    critical_path = _find_critical_path(
        sorted_order, predecessors, successors, schedule
    )

    # Convert day numbers to ISO date strings using "today" as project start
    project_start = datetime.now(timezone.utc)
    result_json: dict[str, dict[str, str | int]] = {}
    for issue_id, sched in schedule.items():
        result_json[issue_id] = {
            "start_day": sched["start"],
            "end_day": sched["end"],
            "start_date": _day_to_date(sched["start"], project_start),
            "end_date": _day_to_date(sched["end"], project_start),
            "duration_days": sched["end"] - sched["start"] + 1,
        }

    # Persist results
    run.status = ScheduleRunStatus.completed
    run.completed_at = datetime.now(timezone.utc)
    run.result_json = result_json
    run.critical_path_json = critical_path
    await session.commit()

    logger.info(
        "auto_schedule_completed",
        run_id=run_id,
        project_id=project_id,
        issues_scheduled=len(result_json),
        critical_path_length=len(critical_path),
    )


async def _mark_failed(
    session: AsyncSession,
    run_id: str,
    error_message: str,
) -> None:
    """Mark a schedule run as failed with an error message."""
    run = await session.get(ScheduleRun, UUID(run_id))
    if run:
        run.status = ScheduleRunStatus.failed
        run.completed_at = datetime.now(timezone.utc)
        run.error_message = error_message
        await session.commit()
