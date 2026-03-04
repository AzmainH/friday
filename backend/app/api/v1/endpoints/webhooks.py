"""Inbound webhook receivers for GitHub and Slack."""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/github")
async def receive_github_webhook(request: Request):
    """Receive GitHub webhook events (push, PR, issue, etc.)."""
    event_type = request.headers.get("X-GitHub-Event", "unknown")
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    logger.info(
        "github_webhook_received",
        event_type=event_type,
        action=payload.get("action"),
        repo=payload.get("repository", {}).get("full_name"),
    )

    # Future: dispatch to GitHubService for processing
    return JSONResponse(
        status_code=200,
        content={"status": "received", "event": event_type},
    )


@router.post("/slack")
async def receive_slack_command(request: Request):
    """Receive Slack slash commands or interaction payloads."""
    try:
        form_data = await request.form()
        command = form_data.get("command", "")
        text = form_data.get("text", "")
        channel_id = form_data.get("channel_id", "")
        user_id = form_data.get("user_id", "")
    except Exception:
        command = ""
        text = ""
        channel_id = ""
        user_id = ""

    logger.info(
        "slack_command_received",
        command=command,
        text=text,
        channel_id=channel_id,
        user_id=user_id,
    )

    # Future: dispatch to SlackService for processing
    return JSONResponse(
        status_code=200,
        content={
            "response_type": "ephemeral",
            "text": f"Received command: {command} {text}",
        },
    )
