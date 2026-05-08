"""VPN / proxy detection with in-memory TTL cache.

Supports two providers (priority order):
  1. vpnapi.io           — VPNAPI_KEY (1k req/day free)
  2. proxycheck.io       — PROXYCHECK_KEY (100/day free, 1k for $$)

If neither is configured, all IPs are reported as not-VPN (best effort).
Result cached for 1h per IP to keep API quotas low.
"""
from __future__ import annotations

import logging
import time
from ipaddress import ip_address
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_CACHE: dict[str, tuple[float, bool]] = {}
_CACHE_TTL = 60 * 60  # 1h


def _is_private(ip: str) -> bool:
    try:
        return ip_address(ip).is_private or ip_address(ip).is_loopback
    except ValueError:
        return True


async def _vpnapi_check(ip: str, key: str) -> bool | None:
    url = f"https://vpnapi.io/api/{ip}?key={key}"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            data: dict[str, Any] = resp.json()
            sec = data.get("security") or {}
            return bool(sec.get("vpn") or sec.get("proxy") or sec.get("tor") or sec.get("relay"))
    except Exception as exc:  # pragma: no cover
        logger.warning("vpnapi.io failed for %s: %s", ip, exc)
        return None


async def _proxycheck_check(ip: str, key: str) -> bool | None:
    url = f"https://proxycheck.io/v2/{ip}?key={key}&vpn=1&risk=1"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            data: dict[str, Any] = resp.json()
            row = data.get(ip) or {}
            return row.get("proxy") == "yes" or row.get("type") in {"VPN", "TOR"}
    except Exception as exc:  # pragma: no cover
        logger.warning("proxycheck.io failed for %s: %s", ip, exc)
        return None


async def is_vpn(ip: str | None) -> bool:
    if not ip or _is_private(ip):
        return False
    now = time.time()
    cached = _CACHE.get(ip)
    if cached and cached[0] > now:
        return cached[1]

    settings = get_settings()
    result: bool | None = None
    if settings.vpnapi_key:
        result = await _vpnapi_check(ip, settings.vpnapi_key)
    if result is None and settings.proxycheck_key:
        result = await _proxycheck_check(ip, settings.proxycheck_key)
    if result is None:
        result = False  # no provider configured / all failed → trust IP

    _CACHE[ip] = (now + _CACHE_TTL, result)
    return result
