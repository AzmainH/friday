"""JWT authentication module for Azure AD / Entra ID.

Supports two modes controlled by ``AUTH_MODE`` in settings:
- ``local`` (default): bypasses JWT validation, returns a dev user
- ``jwt``: validates Azure AD Bearer tokens using RS256 public keys

Adapted from app-factory-skeleton patterns for Friday's architecture.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from jose.exceptions import JWTClaimsError

from app.core.config import settings

security = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# Dev-mode stub
# ---------------------------------------------------------------------------

LOCAL_DEV_USER_ID = "00000000-0000-0000-0000-000000000001"
_LOCAL_DEV_USER: Optional["User"] = None


def _get_local_user() -> User:
    global _LOCAL_DEV_USER
    if _LOCAL_DEV_USER is None:
        _LOCAL_DEV_USER = User(
            {
                "oid": LOCAL_DEV_USER_ID,
                "sub": LOCAL_DEV_USER_ID,
                "preferred_username": "local-dev@localhost",
                "name": "Local Dev User",
                "roles": ["User", "Admin"],
            }
        )
    return _LOCAL_DEV_USER


# ---------------------------------------------------------------------------
# Azure AD helpers
# ---------------------------------------------------------------------------


def _normalized_tenant_id() -> str:
    """Lowercase tenant GUID for URL construction and issuer checks."""
    return (settings.AZURE_TENANT_ID or "").strip().lower()


def _allowed_entra_issuers(tenant_id: str) -> tuple[str, ...]:
    """Issuer strings that Entra may include in JWTs (v1 + v2)."""
    if not tenant_id:
        return ()
    return (
        f"https://login.microsoftonline.com/{tenant_id}/v2.0",
        f"https://sts.windows.net/{tenant_id}/",
        f"https://sts.windows.net/{tenant_id}",
    )


@lru_cache(maxsize=1)
def get_azure_public_keys() -> dict | None:
    """Fetch and cache Azure AD JWKS for token validation."""
    tenant = _normalized_tenant_id()
    if not tenant:
        return None

    openid_url = (
        f"https://login.microsoftonline.com/{tenant}"
        f"/v2.0/.well-known/openid-configuration"
    )
    try:
        with httpx.Client(timeout=10.0) as client:
            config = client.get(openid_url).json()
            jwks = client.get(config["jwks_uri"]).json()
            return jwks
    except Exception:
        return None


def _validate_token_audience(claims: dict, allowed: set[str]) -> None:
    """Verify ``aud`` matches at least one allowed value."""
    if "aud" not in claims:
        return
    aud = claims["aud"]
    aud_list = [aud] if isinstance(aud, str) else aud if isinstance(aud, list) else None
    if aud_list is None or any(not isinstance(c, str) for c in aud_list):
        raise JWTClaimsError("Invalid claim format in token")
    if not any(c in allowed for c in aud_list):
        raise JWTClaimsError("Invalid audience")


def decode_token(token: str) -> dict:
    """Decode and validate an Azure AD JWT."""
    if not _normalized_tenant_id() or not settings.AZURE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Azure AD not configured",
        )

    try:
        jwks = get_azure_public_keys()
        if not jwks:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch Azure AD public keys",
            )

        unverified_header = jwt.get_unverified_header(token)

        rsa_key: dict = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header.get("kid"):
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
                break

        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate signing key",
            )

        allowed_audiences = {
            settings.AZURE_CLIENT_ID,
            f"api://{settings.AZURE_CLIENT_ID}",
        }

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=None,
            issuer=_allowed_entra_issuers(_normalized_tenant_id()),
            options={"verify_aud": False},
        )
        _validate_token_audience(payload, allowed_audiences)
        return payload

    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {exc}",
        )


# ---------------------------------------------------------------------------
# User model
# ---------------------------------------------------------------------------


class User:
    """Authenticated user extracted from a JWT or local stub."""

    __slots__ = ("id", "email", "name", "roles", "raw")

    def __init__(self, payload: dict) -> None:
        self.id: str = payload.get("oid", payload.get("sub", ""))
        self.email: str = payload.get("preferred_username", payload.get("email", ""))
        self.name: str = payload.get("name", "")
        self.roles: list[str] = payload.get("roles", [])
        self.raw: dict = payload


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    """Dependency that returns the current authenticated ``User``.

    When ``AUTH_MODE=local``, returns a dev stub user.
    When ``AUTH_MODE=jwt``, validates the Bearer token against Azure AD.
    """
    if settings.AUTH_MODE.lower() == "local":
        return _get_local_user()

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    return User(payload)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[User]:
    """Like ``get_current_user`` but returns ``None`` when unauthenticated."""
    if settings.AUTH_MODE.lower() == "local":
        return _get_local_user()
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return User(payload)
    except HTTPException:
        return None


def require_role(*roles: str):
    """FastAPI dependency factory: require user to hold at least one role."""

    async def _check(user: User = Depends(get_current_user)) -> User:
        if not roles or not any(r in (user.roles or []) for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return Depends(_check)
