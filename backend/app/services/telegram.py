"""Push order notifications to a Telegram bot.

Fire-and-forget: never blocks order creation. Logs errors quietly.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _format_message(order: dict[str, Any]) -> str:
    geo_country = order.get("geo_country") or "—"
    geo_city = order.get("geo_city") or "—"
    fast = "⚡ Envío rápido (+$2)" if order.get("fast_shipping") else ""

    items_summary = order.get("items_summary") or "—"
    address = order.get("address") or "—"
    city = order.get("city") or "—"

    lines = [
        f"🛒 <b>Order Jdid</b> — <code>{order.get('order_number','?')}</code>",
        "",
        f"👤 <b>{order.get('customer_name','?')}</b>",
        f"📞 <code>{order.get('phone_e164','?')}</code>",
        f"📍 {address}, {city}",
        f"🌍 {geo_country} / {geo_city}",
        "",
        f"💰 <b>${order.get('total','?')}</b> {order.get('currency','USD')}",
        f"📦 {items_summary}",
    ]
    if fast:
        lines.append(fast)
    return "\n".join(lines)


async def _send(token: str, chat_id: str, text: str) -> None:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
            if resp.status_code >= 400:
                logger.warning(
                    "telegram non-2xx status=%s body=%s",
                    resp.status_code,
                    resp.text[:200],
                )
            else:
                logger.info("telegram ok status=%s", resp.status_code)
    except Exception as exc:  # pragma: no cover — must never break checkout
        logger.warning("telegram failed: %s", exc)


def push_order_async(order: dict[str, Any]) -> None:
    settings = get_settings()
    token = settings.telegram_bot_token
    chat_id = settings.telegram_chat_id
    if not token or not chat_id:
        return

    text = _format_message(order)
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return
    loop.create_task(_send(token, chat_id, text))
