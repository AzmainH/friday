"""MCP HTTP client for calling Claude via AWS Bedrock.

Sends JSON-RPC requests to the MCP endpoint using ``httpx.AsyncClient``.
Falls back gracefully when ``MCP_BASE_URL`` is empty (returns ``None``).

Adapted from app-factory-skeleton's ``app_factory_client.py`` for Friday.
"""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from typing import Any

import httpx
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _text_from_content_blocks(content: list) -> str:
    """Join text from MCP ``content[]`` blocks."""
    parts: list[str] = []
    for block in content:
        if not isinstance(block, dict):
            continue
        text = block.get("text")
        if block.get("type") == "text" and text:
            parts.append(str(text))
        elif text:
            parts.append(str(text))
    return "\n".join(parts) if parts else ""


def _text_from_result(result: Any) -> str:
    """Extract text from a ``tools/call`` result object."""
    if result is None:
        return ""
    if isinstance(result, str):
        return result
    if isinstance(result, dict):
        content = result.get("content")
        if isinstance(content, list):
            text = _text_from_content_blocks(content)
            if text:
                return text
        if isinstance(content, str):
            return content
        if "text" in result:
            return str(result["text"])
    return str(result)


# ---------------------------------------------------------------------------
# MCPClient
# ---------------------------------------------------------------------------


class MCPClient:
    """Async HTTP client for MCP JSON-RPC calls."""

    def __init__(self, base_url: str, auth_token: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.auth_token = auth_token

    def _headers(self, *, stream: bool = False) -> dict[str, str]:
        headers: dict[str, str] = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json",
        }
        if stream:
            headers["Accept"] = "text/event-stream"
        return headers

    def _jsonrpc_payload(
        self,
        method: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
        }
        if params is not None:
            payload["params"] = params
        return payload

    # ------------------------------------------------------------------
    # Chat (non-streaming)
    # ------------------------------------------------------------------

    async def chat(
        self,
        messages: list[dict],
        model: str = "sonnet",
        system: str | None = None,
        max_tokens: int = 4096,
    ) -> str:
        """Send a chat request and return the full text response.

        Returns empty string on error so callers can fall back gracefully.
        """
        arguments: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "stream": False,
        }
        if system:
            arguments["system"] = system

        payload = self._jsonrpc_payload(
            "tools/call",
            {"name": "chat", "arguments": arguments},
        )

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(
                    self.base_url,
                    json=payload,
                    headers=self._headers(),
                )
                resp.raise_for_status()
                data = resp.json()

            if "error" in data:
                err = data["error"]
                logger.warning(
                    "mcp_chat_error",
                    error=err.get("message", str(err)),
                )
                return ""

            return _text_from_result(data.get("result"))

        except Exception as exc:
            logger.warning("mcp_chat_failed", error=str(exc))
            return ""

    # ------------------------------------------------------------------
    # Chat (streaming SSE)
    # ------------------------------------------------------------------

    async def chat_stream(
        self,
        messages: list[dict],
        model: str = "sonnet",
        system: str | None = None,
        max_tokens: int = 4096,
    ) -> AsyncGenerator[dict, None]:
        """Stream chat events from MCP via SSE.

        Yields dicts like ``{"type": "content_delta", "text": "..."}`` and
        a final ``{"type": "message_complete", ...}``.
        """
        arguments: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "stream": True,
        }
        if system:
            arguments["system"] = system

        payload = self._jsonrpc_payload(
            "tools/call",
            {"name": "chat", "arguments": arguments},
        )

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                self.base_url,
                json=payload,
                headers=self._headers(stream=True),
                timeout=300.0,
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    rpc = json.loads(line[6:])
                    if "error" in rpc:
                        err = rpc["error"]
                        yield {
                            "type": "error",
                            "message": err.get("message", str(err)),
                        }
                        return
                    result = rpc.get("result")
                    if isinstance(result, dict):
                        yield result

    # ------------------------------------------------------------------
    # Generic tool call
    # ------------------------------------------------------------------

    async def call_tool(
        self,
        name: str,
        arguments: dict | None = None,
        *,
        timeout: float = 60.0,
    ) -> dict:
        """Call an arbitrary MCP tool by name.

        Returns the ``result`` object from the JSON-RPC response.
        """
        payload = self._jsonrpc_payload(
            "tools/call",
            {"name": name, "arguments": arguments or {}},
        )

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                self.base_url,
                json=payload,
                headers=self._headers(),
            )
            resp.raise_for_status()
            body = resp.json()

        if "error" in body:
            err = body["error"]
            raise ValueError(
                f"MCP error {err.get('code', '?')}: {err.get('message', str(err))}"
            )
        return body.get("result", {})


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


def get_mcp_client() -> MCPClient | None:
    """Return an ``MCPClient`` instance or ``None`` when MCP is not configured."""
    base_url = (settings.MCP_BASE_URL or "").strip().rstrip("/")
    auth_token = (settings.MCP_AUTH_TOKEN or "").strip()
    if not base_url:
        return None
    return MCPClient(base_url=base_url, auth_token=auth_token)
