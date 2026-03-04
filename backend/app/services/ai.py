from uuid import UUID

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import NotFoundException, ValidationException
from app.repositories.issue_extras import TaskStatusRepository
from app.services.ai_context import AIContextBuilder

logger = structlog.get_logger()

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None  # type: ignore[assignment,misc]

VALID_TASK_TYPES = {"smart_schedule", "risk_prediction", "summarize"}

TASK_TYPE_TO_FUNCTION = {
    "smart_schedule": "ai_smart_schedule",
    "risk_prediction": "ai_risk_prediction",
    "summarize": "ai_summarize",
}

FRIDAY_SYSTEM_PROMPT = (
    "You are Friday, an AI project management assistant for the Friday PM application. "
    "You help project managers with planning, risk assessment, status reporting, and "
    "task management. Be concise, actionable, and data-driven in your responses. "
    "When given project context, reference specific issues and metrics. "
    "Format your responses in clear, readable text with bullet points where appropriate."
)


class AIService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.task_repo = TaskStatusRepository(session)
        self.context_builder = AIContextBuilder(session)

    async def trigger_task(
        self, project_id: UUID, task_type: str, user_id: UUID
    ) -> dict:
        """Create a TaskStatus entry and enqueue the corresponding ARQ task."""
        if task_type not in VALID_TASK_TYPES:
            raise ValidationException(
                f"Invalid task_type '{task_type}'. "
                f"Must be one of: {', '.join(sorted(VALID_TASK_TYPES))}"
            )

        # Create TaskStatus record to track the background job
        task_status = await self.task_repo.create(
            {
                "task_type": f"ai_{task_type}",
                "entity_id": project_id,
                "user_id": user_id,
                "status": "pending",
                "progress_pct": 0,
            }
        )

        # Enqueue the ARQ task
        from arq.connections import ArqRedis, create_pool

        from app.worker import get_redis_settings

        redis: ArqRedis = await create_pool(get_redis_settings())
        function_name = TASK_TYPE_TO_FUNCTION[task_type]
        await redis.enqueue_job(
            function_name,
            str(project_id),
            str(task_status.id),
        )
        await redis.close()

        return {
            "task_id": task_status.id,
            "status": task_status.status,
            "message": f"AI {task_type} task enqueued successfully",
        }

    async def get_task_status(self, task_id: UUID) -> object:
        """Retrieve a TaskStatus by ID."""
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("AI task not found")
        return task

    async def chat(self, project_id: UUID, message: str) -> str:
        """Synchronous chat that returns AI response immediately.

        Builds project context using AIContextBuilder, sends to OpenAI
        with a system prompt, and returns response text directly.
        Falls back to a helpful mock response when no API key is set.
        """
        project_context = await self.context_builder.build_project_context(project_id)

        if not settings.OPENAI_API_KEY or AsyncOpenAI is None:
            return self._mock_chat_response(message, project_context)

        try:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": FRIDAY_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Project context:\n{project_context}\n\n"
                            f"User question: {message}"
                        ),
                    },
                ],
                max_tokens=2048,
            )
            return response.choices[0].message.content or "No response generated."
        except Exception as exc:
            logger.warning("ai_chat_failed", error=str(exc))
            return self._mock_chat_response(message, project_context)

    async def generate_status_report(self, project_id: UUID) -> str:
        """Generate a weekly status report for the project."""
        project_context = await self.context_builder.build_project_context(project_id)

        prompt = (
            f"Based on the following project context, generate a concise weekly "
            f"status report. Include: overall health, key accomplishments, "
            f"upcoming priorities, risks/blockers, and action items.\n\n"
            f"{project_context}"
        )

        if not settings.OPENAI_API_KEY or AsyncOpenAI is None:
            return self._mock_status_report()

        try:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": FRIDAY_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=2048,
            )
            return response.choices[0].message.content or self._mock_status_report()
        except Exception as exc:
            logger.warning("ai_status_report_failed", error=str(exc))
            return self._mock_status_report()

    async def decompose_task(self, issue_id: UUID) -> str:
        """Suggest sub-tasks for an issue."""
        issue_context = await self.context_builder.build_issue_context(issue_id)

        prompt = (
            f"Based on the following issue, suggest 3-5 well-defined sub-tasks "
            f"that would help break this work down. For each sub-task provide: "
            f"a title, a brief description, and an estimated story point value.\n\n"
            f"{issue_context}"
        )

        if not settings.OPENAI_API_KEY or AsyncOpenAI is None:
            return self._mock_decompose_response()

        try:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": FRIDAY_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=2048,
            )
            return response.choices[0].message.content or self._mock_decompose_response()
        except Exception as exc:
            logger.warning("ai_decompose_task_failed", error=str(exc))
            return self._mock_decompose_response()

    @staticmethod
    def _mock_chat_response(message: str, context: str) -> str:
        """Generate a helpful mock response when OpenAI is unavailable."""
        lower = message.lower()
        if "status" in lower or "how" in lower and "going" in lower:
            return (
                "Based on the current project data, here is a quick overview:\n\n"
                "- The project appears to be progressing steadily\n"
                "- There are some high-priority issues that need attention\n"
                "- I recommend reviewing the backlog for any blockers\n\n"
                "For a detailed status report, try the 'Status Report' quick action."
            )
        if "risk" in lower or "block" in lower:
            return (
                "Here are potential risks I can identify:\n\n"
                "- High-priority issues may indicate resource constraints\n"
                "- Review dependencies between tasks for potential bottlenecks\n"
                "- Consider team capacity when planning the next sprint\n\n"
                "For a full risk analysis, try the 'Risk Analysis' quick action."
            )
        if "schedule" in lower or "plan" in lower or "timeline" in lower:
            return (
                "For scheduling recommendations:\n\n"
                "- Prioritize critical path items first\n"
                "- Consider task dependencies when reordering\n"
                "- Buffer time should be added for high-risk items\n\n"
                "For AI-powered scheduling, try the 'Smart Schedule' quick action."
            )
        return (
            "I'm Friday, your AI project management assistant. I can help with:\n\n"
            "- **Project status** - Ask me how the project is going\n"
            "- **Risk analysis** - Ask about potential risks or blockers\n"
            "- **Scheduling** - Ask about timeline or planning advice\n"
            "- **Task breakdown** - Ask me to decompose complex tasks\n\n"
            "You can also use the quick action buttons for targeted analysis. "
            "Note: Connect an OpenAI API key for more detailed, context-aware responses."
        )

    @staticmethod
    def _mock_status_report() -> str:
        return (
            "## Weekly Status Report\n\n"
            "**Overall Health:** On Track\n\n"
            "### Key Accomplishments\n"
            "- Multiple issues progressed through the pipeline\n"
            "- No critical blockers reported this week\n\n"
            "### Upcoming Priorities\n"
            "- Address high-priority issues in the backlog\n"
            "- Review upcoming milestone deadlines\n\n"
            "### Risks & Blockers\n"
            "- Monitor team capacity for the next sprint\n"
            "- Review any dependency chains for potential delays\n\n"
            "### Action Items\n"
            "- Schedule backlog grooming session\n"
            "- Update issue estimates where needed\n\n"
            "*Note: Connect an OpenAI API key for data-driven reports.*"
        )

    @staticmethod
    def _mock_decompose_response() -> str:
        return (
            "Here are suggested sub-tasks:\n\n"
            "1. **Research & Analysis** (2 SP)\n"
            "   Investigate requirements and existing patterns in the codebase.\n\n"
            "2. **Implementation - Core Logic** (3 SP)\n"
            "   Build the main functionality with proper error handling.\n\n"
            "3. **Unit Tests** (2 SP)\n"
            "   Write comprehensive tests covering happy path and edge cases.\n\n"
            "4. **Integration & Documentation** (1 SP)\n"
            "   Wire up with existing code and update relevant documentation.\n\n"
            "*Note: Connect an OpenAI API key for context-specific sub-task suggestions.*"
        )
