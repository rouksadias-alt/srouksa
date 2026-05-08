"""Push orders to a Google Sheets webhook (Apps Script Web App).

Fire-and-forget: never blocks order creation. Logs errors quietly.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def _post(url: str, payload: dict[str, Any]) -> None:
    """POST with manual redirect handling that preserves method+body.

    Google Apps Script /exec returns 302 to script.googleusercontent.com.
    Most HTTP clients (httpx, curl -L) convert POST→GET on 302 per RFC 7231,
    which drops the body. We re-POST to the Location target ourselves.
    """
    try:
        headers = {"Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
            current_url = url
            for _ in range(5):
                resp = await client.post(current_url, json=payload, headers=headers)
                if resp.status_code in (301, 302, 303, 307, 308):
                    location = resp.headers.get("location")
                    if not location:
                        break
                    current_url = location
                    continue
                break
            if resp.status_code >= 400:
                logger.warning(
                    "sheets webhook non-2xx status=%s body=%s",
                    resp.status_code,
                    resp.text[:200],
                )
            else:
                logger.info("sheets webhook ok status=%s", resp.status_code)
    except Exception as exc:  # pragma: no cover — webhook must never break checkout
        logger.warning("sheets webhook failed: %s", exc)


def push_order_async(order: dict[str, Any]) -> None:
    """Schedule a non-blocking POST to the configured Sheets webhook.

    Safe to call even when no webhook is configured (will no-op).
    """
    settings = get_settings()
    url = settings.google_sheets_webhook_url
    if not url:
        return

    body: dict[str, Any] = {"type": "order", "order": order}
    if settings.google_sheets_webhook_secret:
        body["secret"] = settings.google_sheets_webhook_secret

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return
    loop.create_task(_post(str(url), body))
