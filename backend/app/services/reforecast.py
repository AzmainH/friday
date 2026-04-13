"""AI Re-forecasting Engine — pure algorithmic schedule propagation."""

from collections import defaultdict, deque
from datetime import date, timedelta
from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundException
from app.models.baseline import Baseline, BaselineSnapshot
from app.models.issue import Issue
from app.models.issue_relation import IssueLink, IssueLinkType

logger = structlog.get_logger(__name__)

# Link types that imply a scheduling dependency (predecessor -> successor).
_DEPENDENCY_LINK_TYPES = {
    IssueLinkType.BLOCKS,
    IssueLinkType.IS_BLOCKED_BY,
    IssueLinkType.DEPENDS_ON,
    IssueLinkType.IS_DEPENDENCY_OF,
}


class ReforecastService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _load_project_issues(self, project_id: UUID) -> dict[UUID, Issue]:
        """Load all non-deleted issues for a project, keyed by id."""
        result = await self.session.execute(
            select(Issue).where(
                Issue.project_id == project_id,
                Issue.is_deleted == False,  # noqa: E712
            )
        )
        issues = result.scalars().all()
        if not issues:
            raise NotFoundException(f"No issues found for project {project_id}")
        return {issue.id: issue for issue in issues}

    async def _load_dependency_links(self, project_id: UUID) -> list[IssueLink]:
        """Load all scheduling-relevant links for issues in *project_id*."""
        result = await self.session.execute(
            select(IssueLink)
            .join(Issue, IssueLink.source_issue_id == Issue.id)
            .where(
                Issue.project_id == project_id,
                Issue.is_deleted == False,  # noqa: E712
                IssueLink.link_type.in_(_DEPENDENCY_LINK_TYPES),
            )
        )
        return list(result.scalars().all())

    @staticmethod
    def _build_dependency_graph(
        issues: dict[UUID, Issue],
        links: list[IssueLink],
    ) -> dict[UUID, list[UUID]]:
        """Build an adjacency list mapping each predecessor to its successors.

        Normalises link direction so that every edge means
        "predecessor -> successor" regardless of how the link was stored.
        """
        graph: dict[UUID, list[UUID]] = defaultdict(list)

        for link in links:
            src = link.source_issue_id
            tgt = link.target_issue_id

            # Skip links referencing issues outside the project set.
            if src not in issues or tgt not in issues:
                continue

            if link.link_type in (IssueLinkType.BLOCKS, IssueLinkType.IS_DEPENDENCY_OF):
                # source blocks/is-dependency-of target -> source is predecessor
                graph[src].append(tgt)
            elif link.link_type in (IssueLinkType.IS_BLOCKED_BY, IssueLinkType.DEPENDS_ON):
                # source is-blocked-by/depends-on target -> target is predecessor
                graph[tgt].append(src)

        return graph

    @staticmethod
    def _detect_cycle(graph: dict[UUID, list[UUID]], all_ids: set[UUID]) -> bool:
        """Return True if *graph* contains a cycle (Kahn's algorithm)."""
        in_degree: dict[UUID, int] = defaultdict(int)
        for node_id in all_ids:
            in_degree.setdefault(node_id, 0)
        for successors in graph.values():
            for s in successors:
                in_degree[s] += 1

        queue = deque(node_id for node_id, deg in in_degree.items() if deg == 0)
        visited = 0
        while queue:
            node = queue.popleft()
            visited += 1
            for succ in graph.get(node, []):
                in_degree[succ] -= 1
                if in_degree[succ] == 0:
                    queue.append(succ)

        return visited != len(all_ids)

    @staticmethod
    def _topological_order(
        graph: dict[UUID, list[UUID]], all_ids: set[UUID]
    ) -> list[UUID]:
        """Return a topological ordering of *all_ids* using Kahn's algorithm.

        Assumes no cycles (caller must check beforehand).
        """
        in_degree: dict[UUID, int] = defaultdict(int)
        for node_id in all_ids:
            in_degree.setdefault(node_id, 0)
        for successors in graph.values():
            for s in successors:
                in_degree[s] += 1

        queue = deque(node_id for node_id, deg in in_degree.items() if deg == 0)
        order: list[UUID] = []
        while queue:
            node = queue.popleft()
            order.append(node)
            for succ in graph.get(node, []):
                in_degree[succ] -= 1
                if in_degree[succ] == 0:
                    queue.append(succ)
        return order

    @staticmethod
    def _task_duration(issue: Issue) -> int:
        """Return the planned duration of *issue* in calendar days (min 1)."""
        if issue.planned_start and issue.planned_end:
            delta = (issue.planned_end - issue.planned_start).days
            return max(delta, 1)
        return 1

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def reforecast_from_update(
        self,
        project_id: UUID,
        updated_task_ids: list[UUID],
    ) -> dict:
        """Propagate date changes from *updated_task_ids* downstream.

        Returns a dict matching the ``ReforecastResult`` schema.
        """
        issues = await self._load_project_issues(project_id)
        links = await self._load_dependency_links(project_id)
        graph = self._build_dependency_graph(issues, links)
        all_ids = set(issues.keys())

        if self._detect_cycle(graph, all_ids):
            logger.warning("reforecast.cycle_detected", project_id=str(project_id))
            return {
                "project_id": project_id,
                "adjusted_tasks": [],
                "total_tasks_affected": 0,
            }

        topo_order = self._topological_order(graph, all_ids)

        # Build reverse lookup (child -> list of parents)
        predecessors: dict[UUID, list[UUID]] = defaultdict(list)
        for parent, children in graph.items():
            for child in children:
                predecessors[child].append(parent)

        # Seed: mark the explicitly-updated tasks so we know their dates are
        # authoritative; then propagate forward along topo order.
        adjusted: dict[UUID, dict] = {}

        for node_id in topo_order:
            issue = issues[node_id]
            preds = predecessors.get(node_id, [])

            if not preds:
                # Root task -- nothing to propagate.
                continue

            # Determine the earliest possible start: max(predecessor end dates) + 1 day.
            max_pred_end: date | None = None
            for pred_id in preds:
                pred = issues[pred_id]
                pred_end = pred.planned_end
                # If the predecessor was already adjusted, use the new end date.
                if pred_id in adjusted:
                    pred_end = adjusted[pred_id]["new_planned_end"]
                if pred_end is not None:
                    if max_pred_end is None or pred_end > max_pred_end:
                        max_pred_end = pred_end

            if max_pred_end is None:
                continue

            new_start = max_pred_end + timedelta(days=1)
            duration = self._task_duration(issue)
            new_end = new_start + timedelta(days=duration)

            old_start = issue.planned_start
            old_end = issue.planned_end

            # Only record if the dates actually changed.
            if new_start == old_start and new_end == old_end:
                continue

            variance = (new_end - old_end).days if old_end else 0

            adjusted[node_id] = {
                "task_id": node_id,
                "task_summary": issue.summary,
                "old_planned_start": old_start,
                "old_planned_end": old_end,
                "new_planned_start": new_start,
                "new_planned_end": new_end,
                "variance_days": variance,
            }

            # Update the in-memory issue so downstream dependents see new dates.
            issue.planned_start = new_start
            issue.planned_end = new_end

        logger.info(
            "reforecast.complete",
            project_id=str(project_id),
            updated_tasks=len(updated_task_ids),
            adjusted_tasks=len(adjusted),
        )

        return {
            "project_id": project_id,
            "adjusted_tasks": list(adjusted.values()),
            "total_tasks_affected": len(adjusted),
        }

    async def calculate_critical_path(self, project_id: UUID) -> dict:
        """Find the longest path through the dependency graph.

        Returns a dict matching the ``CriticalPath`` schema.
        """
        issues = await self._load_project_issues(project_id)
        links = await self._load_dependency_links(project_id)
        graph = self._build_dependency_graph(issues, links)
        all_ids = set(issues.keys())

        if self._detect_cycle(graph, all_ids):
            logger.warning("critical_path.cycle_detected", project_id=str(project_id))
            return {
                "project_id": project_id,
                "path": [],
                "total_duration_days": 0,
                "tasks": [],
            }

        topo_order = self._topological_order(graph, all_ids)

        # Dynamic programming: longest path in DAG.
        dist: dict[UUID, int] = {nid: 0 for nid in all_ids}
        prev: dict[UUID, UUID | None] = {nid: None for nid in all_ids}

        for node_id in topo_order:
            duration = self._task_duration(issues[node_id])
            for succ in graph.get(node_id, []):
                candidate = dist[node_id] + duration
                if candidate > dist[succ]:
                    dist[succ] = candidate
                    prev[succ] = node_id

        # Find the node with the maximum distance (end of critical path).
        end_node = max(all_ids, key=lambda nid: dist[nid])
        total_duration = dist[end_node] + self._task_duration(issues[end_node])

        # Reconstruct path.
        path_ids: list[UUID] = []
        current: UUID | None = end_node
        while current is not None:
            path_ids.append(current)
            current = prev[current]
        path_ids.reverse()

        tasks_detail = []
        for tid in path_ids:
            issue = issues[tid]
            tasks_detail.append(
                {
                    "task_id": str(tid),
                    "summary": issue.summary,
                    "planned_start": issue.planned_start.isoformat() if issue.planned_start else None,
                    "planned_end": issue.planned_end.isoformat() if issue.planned_end else None,
                    "percent_complete": issue.percent_complete,
                    "duration_days": self._task_duration(issue),
                }
            )

        logger.info(
            "critical_path.calculated",
            project_id=str(project_id),
            path_length=len(path_ids),
            total_duration_days=total_duration,
        )

        return {
            "project_id": project_id,
            "path": path_ids,
            "total_duration_days": total_duration,
            "tasks": tasks_detail,
        }

    async def detect_variance_alerts(self, project_id: UUID) -> list[dict]:
        """Compare current issue state to the latest baseline and generate alerts.

        Alert types:
        - overdue: planned_end < today and task is not complete
        - blocker_aged: a blocked issue has been waiting > 3 days
        - critical_path_slip: a task on the critical path has slipped
        - no_update: no progress change in 7+ days
        """
        issues = await self._load_project_issues(project_id)
        links = await self._load_dependency_links(project_id)
        today = date.today()

        # Load latest baseline and its snapshots for comparison.
        baseline_result = await self.session.execute(
            select(Baseline)
            .where(Baseline.project_id == project_id)
            .order_by(Baseline.snapshot_date.desc())
            .limit(1)
        )
        baseline = baseline_result.scalar_one_or_none()

        snapshot_map: dict[UUID, BaselineSnapshot] = {}
        if baseline:
            snap_result = await self.session.execute(
                select(BaselineSnapshot).where(
                    BaselineSnapshot.baseline_id == baseline.id
                )
            )
            for snap in snap_result.scalars().all():
                snapshot_map[snap.issue_id] = snap

        # Pre-compute critical path to flag critical-path slips.
        cp_result = await self.calculate_critical_path(project_id)
        critical_path_ids = set(cp_result.get("path", []))

        # Build set of blocked issue ids.
        blocked_ids: dict[UUID, date | None] = {}
        for link in links:
            if link.link_type in (IssueLinkType.IS_BLOCKED_BY, IssueLinkType.DEPENDS_ON):
                blocker = issues.get(link.target_issue_id)
                if blocker and blocker.percent_complete < 100:
                    blocked_ids[link.source_issue_id] = blocker.planned_end

        alerts: list[dict] = []

        for issue_id, issue in issues.items():
            # --- overdue ---
            if (
                issue.planned_end
                and issue.planned_end < today
                and issue.percent_complete < 100
            ):
                overdue_days = (today - issue.planned_end).days
                severity = "critical" if overdue_days > 7 else (
                    "high" if overdue_days > 3 else "medium"
                )
                alerts.append(
                    {
                        "task_id": issue_id,
                        "task_summary": issue.summary,
                        "alert_type": "overdue",
                        "severity": severity,
                        "message": f"Task is {overdue_days} day(s) past its planned end date.",
                        "variance_days": overdue_days,
                    }
                )

            # --- blocker_aged ---
            if issue_id in blocked_ids:
                blocker_end = blocked_ids[issue_id]
                if blocker_end and blocker_end < today:
                    aged_days = (today - blocker_end).days
                    if aged_days > 3:
                        severity = "high" if aged_days > 7 else "medium"
                        alerts.append(
                            {
                                "task_id": issue_id,
                                "task_summary": issue.summary,
                                "alert_type": "blocker_aged",
                                "severity": severity,
                                "message": (
                                    f"Blocked for {aged_days} day(s) by an overdue predecessor."
                                ),
                                "variance_days": aged_days,
                            }
                        )

            # --- critical_path_slip ---
            if issue_id in critical_path_ids and issue_id in snapshot_map:
                snap = snapshot_map[issue_id]
                if snap.planned_end and issue.planned_end and issue.planned_end > snap.planned_end:
                    slip_days = (issue.planned_end - snap.planned_end).days
                    severity = "critical" if slip_days > 5 else (
                        "high" if slip_days > 2 else "medium"
                    )
                    alerts.append(
                        {
                            "task_id": issue_id,
                            "task_summary": issue.summary,
                            "alert_type": "critical_path_slip",
                            "severity": severity,
                            "message": (
                                f"Critical-path task slipped {slip_days} day(s) vs. baseline."
                            ),
                            "variance_days": slip_days,
                        }
                    )

            # --- no_update ---
            if issue_id in snapshot_map:
                snap = snapshot_map[issue_id]
                if (
                    issue.percent_complete == (snap.story_points or 0)
                    and issue.percent_complete < 100
                    and issue.planned_start
                    and issue.planned_start <= today
                ):
                    # Use the baseline snapshot date as a proxy for "last known state".
                    if baseline and baseline.snapshot_date:
                        snap_date = baseline.snapshot_date.date() if hasattr(
                            baseline.snapshot_date, "date"
                        ) else baseline.snapshot_date
                        stale_days = (today - snap_date).days
                        if stale_days >= 7:
                            alerts.append(
                                {
                                    "task_id": issue_id,
                                    "task_summary": issue.summary,
                                    "alert_type": "no_update",
                                    "severity": "low",
                                    "message": (
                                        f"No progress change detected in {stale_days} day(s)."
                                    ),
                                    "variance_days": stale_days,
                                }
                            )

        logger.info(
            "variance_alerts.detected",
            project_id=str(project_id),
            alert_count=len(alerts),
        )

        return alerts
