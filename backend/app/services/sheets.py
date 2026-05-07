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
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code >= 400:
                logger.warning(
                    "sheets webhook non-2xx status=%s body=%s",
                    resp.status_code,
                    resp.text[:200],
                )
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
