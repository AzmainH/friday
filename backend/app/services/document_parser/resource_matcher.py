from __future__ import annotations

from typing import TYPE_CHECKING

import structlog
from sqlalchemy import select

from app.models.user import User
from app.services.document_parser.models import ResourceMatch

if TYPE_CHECKING:
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


class ResourceMatcher:
    """Fuzzy-match resource names extracted from documents to system ``User`` records.

    Matching is attempted in decreasing order of confidence:

    1. Exact ``display_name`` match (confidence 1.0)
    2. Case-insensitive ``display_name`` match (confidence 0.95)
    3. First + last name partial match (confidence 0.8)
    4. Substring / contains match (confidence 0.6)
    5. No match found (confidence 0.0)
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def match_resources(
        self,
        resource_names: list[str],
    ) -> list[ResourceMatch]:
        """Match a list of document resource names to active system users.

        Args:
            resource_names: Names as they appear in the uploaded documents.

        Returns:
            A ``ResourceMatch`` per input name, ordered to match the input list.
        """
        if not resource_names:
            return []

        users = await self._load_active_users()

        logger.info(
            "resource_matcher.start",
            resource_count=len(resource_names),
            user_count=len(users),
        )

        results: list[ResourceMatch] = []
        for name in resource_names:
            match = self._find_best_match(name, users)
            results.append(match)

        matched_count = sum(1 for r in results if r.matched_user_id is not None)
        logger.info(
            "resource_matcher.complete",
            total=len(results),
            matched=matched_count,
            unmatched=len(results) - matched_count,
        )

        return results

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _load_active_users(self) -> list[_UserRecord]:
        """Load all active, non-deleted users from the database."""
        stmt = (
            select(User.id, User.display_name, User.email)
            .where(User.is_active.is_(True))
            .where(User.is_deleted.is_(False))
        )
        result = await self._session.execute(stmt)
        rows = result.all()

        return [
            _UserRecord(user_id=row.id, display_name=row.display_name, email=row.email)
            for row in rows
        ]

    def _find_best_match(
        self,
        name: str,
        users: list[_UserRecord],
    ) -> ResourceMatch:
        """Run through the matching tiers for a single resource name."""
        if not name or not name.strip():
            return ResourceMatch(document_name=name, confidence=0.0)

        clean_name = name.strip()

        # --- Tier 1: exact display_name match ---
        for user in users:
            if user.display_name == clean_name:
                return ResourceMatch(
                    document_name=name,
                    matched_user_id=user.id,
                    matched_display_name=user.display_name,
                    confidence=1.0,
                )

        # --- Tier 2: case-insensitive display_name match ---
        name_lower = clean_name.lower()
        for user in users:
            if user.display_name.lower() == name_lower:
                return ResourceMatch(
                    document_name=name,
                    matched_user_id=user.id,
                    matched_display_name=user.display_name,
                    confidence=0.95,
                )

        # --- Tier 3: first + last name partial match ---
        name_parts = set(name_lower.split())
        if len(name_parts) >= 2:  # noqa: PLR2004
            for user in users:
                user_parts = set(user.display_name.lower().split())
                # Both first and last name tokens must appear.
                if len(name_parts & user_parts) >= 2:  # noqa: PLR2004
                    return ResourceMatch(
                        document_name=name,
                        matched_user_id=user.id,
                        matched_display_name=user.display_name,
                        confidence=0.8,
                    )

        # --- Tier 4: contains match ---
        for user in users:
            user_lower = user.display_name.lower()
            if name_lower in user_lower or user_lower in name_lower:
                return ResourceMatch(
                    document_name=name,
                    matched_user_id=user.id,
                    matched_display_name=user.display_name,
                    confidence=0.6,
                )

        # --- Tier 5: no match ---
        logger.debug("resource_matcher.no_match", document_name=name)
        return ResourceMatch(document_name=name, confidence=0.0)


# ------------------------------------------------------------------
# Lightweight internal data class to avoid passing full ORM objects
# ------------------------------------------------------------------


class _UserRecord:
    """In-memory projection of the User columns needed for matching."""

    __slots__ = ("id", "display_name", "email")

    def __init__(self, *, user_id: UUID, display_name: str, email: str) -> None:
        self.id = user_id
        self.display_name = display_name
        self.email = email
