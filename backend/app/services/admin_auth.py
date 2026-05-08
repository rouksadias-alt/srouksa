"""Admin authentication via signed HttpOnly cookie.

Login: POST /api/admin/login with {username, password}. If the credentials
match `ADMIN_USERNAME` / `ADMIN_PASSWORD` in env, we issue a signed token
(via itsdangerous) as cookie `admin_session`.

All `/api/admin/*` routes use the `require_admin` dependency to verify it.
"""
from __future__ import annotations

import hmac
import logging
import secrets
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Response, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.core.config import get_settings

logger = logging.getLogger(__name__)

COOKIE_NAME = "admin_session"
SALT = "numapet.admin.session.v1"


def _serializer() -> URLSafeTimedSerializer:
    settings = get_settings()
    return URLSafeTimedSerializer(settings.admin_session_secret, salt=SALT)


def issue_token(username: str) -> str:
    return _serializer().dumps({"sub": username})


def verify_token(token: str) -> str | None:
    settings = get_settings()
    try:
        data = _serializer().loads(token, max_age=settings.admin_session_max_age)
        if isinstance(data, dict) and isinstance(data.get("sub"), str):
            return data["sub"]
    except (BadSignature, SignatureExpired):
        return None
    return None


def check_credentials(username: str, password: str) -> bool:
    settings = get_settings()
    if not settings.admin_username or not settings.admin_password:
        return False
    if not username or not password:
        return False
    # constant-time compare
    return (
        hmac.compare_digest(username, settings.admin_username)
        and hmac.compare_digest(password, settings.admin_password)
    )


def set_session_cookie(response: Response, username: str) -> None:
    settings = get_settings()
    token = issue_token(username)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=settings.admin_session_max_age,
        httponly=True,
        secure=True,
        samesite="none",  # cross-origin: numapet.store ↔ api.numapet.store
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        secure=True,
        samesite="none",
    )


async def require_admin(
    admin_session: Annotated[str | None, Cookie()] = None,
) -> str:
    if not admin_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="not authenticated")
    user = verify_token(admin_session)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid session")
    return user


# Random nonce for clients that need a CSRF marker (we rely primarily on
# samesite + cookie httponly + admin auth scope).
def random_nonce() -> str:
    return secrets.token_urlsafe(16)
