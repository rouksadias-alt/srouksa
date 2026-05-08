"""Public page-view tracking. Frontend calls POST /api/visits on each page."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import text

from app.core.config import get_settings
from app.db import AsyncSessionLocal
from app.services.geoip import GeoIPReader, get_client_ip
from app.services.vpn import is_vpn

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/visits")


class VisitIn(BaseModel):
    session_id: str | None = None
    path: str
    referrer: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    fbclid: str | None = None
    ttclid: str | None = None


@router.post("")
async def record_visit(visit: VisitIn, request: Request) -> dict[str, Any]:
    settings = get_settings()
    ip = get_client_ip(dict(request.headers), request.client.host if request.client else None)
    geo = GeoIPReader.instance().lookup(ip)
    user_agent = request.headers.get("user-agent")

    vpn_flag = await is_vpn(ip)

    allowed = settings.allowed_country_list
    country_ok = (not allowed) or (geo.country in allowed) if geo.country else True
    is_valid = country_ok and not vpn_flag

    async with AsyncSessionLocal() as session:
        await session.execute(
            text(
                """
                INSERT INTO visits (
                    session_id, path, referrer, user_agent,
                    ip_address, geo_country, geo_city, is_vpn, is_valid,
                    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
                    fbclid, ttclid
                ) VALUES (
                    :session_id, :path, :referrer, :user_agent,
                    :ip, :country, :city, :is_vpn, :is_valid,
                    :utm_source, :utm_medium, :utm_campaign, :utm_content, :utm_term,
                    :fbclid, :ttclid
                )
                """
            ),
            {
                "session_id": visit.session_id,
                "path": visit.path[:500],
                "referrer": (visit.referrer or "")[:500] or None,
                "user_agent": (user_agent or "")[:500] or None,
                "ip": ip,
                "country": geo.country,
                "city": geo.city,
                "is_vpn": vpn_flag,
                "is_valid": is_valid,
                "utm_source": visit.utm_source,
                "utm_medium": visit.utm_medium,
                "utm_campaign": visit.utm_campaign,
                "utm_content": visit.utm_content,
                "utm_term": visit.utm_term,
                "fbclid": visit.fbclid,
                "ttclid": visit.ttclid,
            },
        )
        await session.commit()

    return {"ok": True, "valid": is_valid}
