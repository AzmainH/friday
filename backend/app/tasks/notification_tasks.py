"""ARQ background tasks for notification email delivery."""

import logging
from uuid import UUID

from app.core.config import settings
from app.core.database import async_session_factory

logger = logging.getLogger(__name__)


async def send_email_notification(
    ctx: dict,
    user_id: str,
    subject: str,
    body: str,
    to_email: str | None = None,
):
    """Send a single email notification via SMTP."""
    if not settings.EMAIL_ENABLED:
        logger.info("Email disabled, skipping notification to %s", user_id)
        return {"status": "skipped", "reason": "email_disabled"}

    try:
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        # If no email provided, look up user's email
        if not to_email:
            async with async_session_factory() as session:
                from app.repositories.user import UserRepository

                user_repo = UserRepository(session)
                user = await user_repo.get_by_id(UUID(user_id))
                if not user or not user.email:
                    return {"status": "skipped", "reason": "no_email"}
                to_email = user.email

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email

        # Plain text version
        msg.attach(MIMEText(body, "plain"))

        # HTML version
        html_body = (
            '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">'
            f'<h2 style="color: #4f46e5;">{subject}</h2>'
            f"<p>{body}</p>"
            '<hr style="border: 1px solid #e5e7eb;">'
            '<p style="color: #6b7280; font-size: 12px;">'
            f'Sent from Friday PM &mdash; <a href="{settings.APP_URL}">Open Friday</a>'
            "</p>"
            "</div>"
        )
        msg.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            start_tls=settings.SMTP_USE_TLS,
            username=settings.SMTP_USERNAME or None,
            password=settings.SMTP_PASSWORD or None,
        )

        logger.info("Email sent to %s: %s", to_email, subject)
        return {"status": "sent", "to": to_email}

    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, str(e))
        return {"status": "failed", "error": str(e)}


async def send_daily_digest(ctx: dict, user_id: str | None = None):
    """Send a daily digest of unread notifications.

    When user_id is provided, sends digest for that specific user.
    When called as a cron job (no user_id), this is a placeholder
    that should be extended to iterate over all users with unread
    notifications.
    """
    if not settings.EMAIL_ENABLED:
        return {"status": "skipped", "reason": "email_disabled"}

    if not user_id:
        logger.info("Daily digest cron triggered — no specific user_id provided")
        return {"status": "skipped", "reason": "no_user_id"}

    async with async_session_factory() as session:
        from app.repositories.issue_extras import NotificationRepository
        from app.repositories.user import UserRepository

        notification_repo = NotificationRepository(session)
        user_repo = UserRepository(session)

        user = await user_repo.get_by_id(UUID(user_id))
        if not user or not user.email:
            return {"status": "skipped", "reason": "no_email"}

        # Get unread notifications
        result = await notification_repo.get_by_user(
            UUID(user_id), is_read=False, limit=50
        )
        notifications = result.get("data", [])

        if not notifications:
            return {"status": "skipped", "reason": "no_unread"}

        # Build digest
        subject = f"Friday PM \u2014 {len(notifications)} unread notification(s)"
        body_lines = [f"You have {len(notifications)} unread notifications:\n"]
        for n in notifications[:20]:
            body_lines.append(f"\u2022 {n.title}: {n.body}")
        if len(notifications) > 20:
            body_lines.append(f"\n...and {len(notifications) - 20} more")

        body = "\n".join(body_lines)

        await send_email_notification(
            ctx, user_id, subject, body, to_email=user.email
        )

        return {"status": "sent", "count": len(notifications)}
