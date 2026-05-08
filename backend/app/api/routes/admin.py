"""Admin dashboard API.

All endpoints (except /login) require a valid `admin_session` cookie.
Metrics filter visits by `is_valid = true` (KSA / allowed-country IP, no VPN).
"""
from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy import text

from app.db import AsyncSessionLocal
from app.services.admin_auth import (
    check_credentials,
    clear_session_cookie,
    require_admin,
    set_session_cookie,
)

router = APIRouter(prefix="/admin")

ALLOWED_STATUSES = {
    "pending_confirmation",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
    "no_answer",
}


# ---------------------------------------------------------------- auth
class LoginIn(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(payload: LoginIn, response: Response) -> dict[str, Any]:
    if not check_credentials(payload.username, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    set_session_cookie(response, payload.username)
    return {"ok": True, "user": payload.username}


@router.post("/logout")
async def logout(response: Response) -> dict[str, Any]:
    clear_session_cookie(response)
    return {"ok": True}


@router.get("/me")
async def me(user: Annotated[str, Depends(require_admin)]) -> dict[str, Any]:
    return {"user": user}


# ---------------------------------------------------------------- helpers
def _parse_range(date_from: str | None, date_to: str | None) -> tuple[datetime, datetime]:
    today = date.today()
    if date_from:
        d_from = date.fromisoformat(date_from)
    else:
        d_from = today - timedelta(days=6)
    if date_to:
        d_to = date.fromisoformat(date_to)
    else:
        d_to = today
    if d_to < d_from:
        d_from, d_to = d_to, d_from
    start = datetime.combine(d_from, time.min, tzinfo=timezone.utc)
    end = datetime.combine(d_to, time.max, tzinfo=timezone.utc)
    return start, end


# ---------------------------------------------------------------- stats
@router.get("/stats")
async def stats(
    _: Annotated[str, Depends(require_admin)],
    date_from: str | None = Query(default=None, alias="from"),
    date_to: str | None = Query(default=None, alias="to"),
) -> dict[str, Any]:
    start, end = _parse_range(date_from, date_to)

    async with AsyncSessionLocal() as session:
        # Visits totals
        v = (await session.execute(
            text(
                """
                SELECT
                    COUNT(*)                                AS total,
                    COUNT(*) FILTER (WHERE is_valid)        AS valid,
                    COUNT(*) FILTER (WHERE is_vpn)          AS vpn,
                    COUNT(DISTINCT session_id) FILTER (WHERE is_valid) AS valid_sessions,
                    COUNT(DISTINCT session_id)              AS total_sessions
                FROM visits
                WHERE created_at BETWEEN :s AND :e
                """
            ),
            {"s": start, "e": end},
        )).mappings().one()

        # Orders totals (valid = country allowed AND not VPN)
        o = (await session.execute(
            text(
                """
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE NOT is_vpn) AS valid,
                    COALESCE(SUM(total) FILTER (WHERE NOT is_vpn AND status NOT IN ('cancelled','returned')), 0) AS revenue,
                    COUNT(*) FILTER (WHERE status = 'pending_confirmation') AS pending,
                    COUNT(*) FILTER (WHERE status = 'confirmed')           AS confirmed,
                    COUNT(*) FILTER (WHERE status = 'shipped')             AS shipped,
                    COUNT(*) FILTER (WHERE status = 'delivered')           AS delivered,
                    COUNT(*) FILTER (WHERE status = 'cancelled')           AS cancelled
                FROM orders
                WHERE created_at BETWEEN :s AND :e
                """
            ),
            {"s": start, "e": end},
        )).mappings().one()

        # Daily breakdown (visits & orders)
        daily_rows = (await session.execute(
            text(
                """
                WITH days AS (
                    SELECT generate_series(:s::date, :e::date, INTERVAL '1 day')::date AS d
                ),
                v AS (
                    SELECT created_at::date AS d,
                           COUNT(*) FILTER (WHERE is_valid) AS valid,
                           COUNT(*)                         AS total
                    FROM visits
                    WHERE created_at BETWEEN :s AND :e
                    GROUP BY 1
                ),
                o AS (
                    SELECT created_at::date AS d,
                           COUNT(*) FILTER (WHERE NOT is_vpn) AS valid,
                           COUNT(*)                            AS total
                    FROM orders
                    WHERE created_at BETWEEN :s AND :e
                    GROUP BY 1
                )
                SELECT
                    days.d::text                              AS day,
                    COALESCE(v.valid, 0)::int                 AS visits_valid,
                    COALESCE(v.total, 0)::int                 AS visits_total,
                    COALESCE(o.valid, 0)::int                 AS orders_valid,
                    COALESCE(o.total, 0)::int                 AS orders_total
                FROM days
                LEFT JOIN v ON v.d = days.d
                LEFT JOIN o ON o.d = days.d
                ORDER BY days.d ASC
                """
            ),
            {"s": start, "e": end},
        )).mappings().all()

        # Top cities
        cities = (await session.execute(
            text(
                """
                SELECT geo_city AS city, COUNT(*) AS visits
                FROM visits
                WHERE created_at BETWEEN :s AND :e AND is_valid AND geo_city IS NOT NULL
                GROUP BY geo_city
                ORDER BY visits DESC
                LIMIT 8
                """
            ),
            {"s": start, "e": end},
        )).mappings().all()

        # Top utm sources
        sources = (await session.execute(
            text(
                """
                SELECT COALESCE(utm_source, '(direct)') AS source, COUNT(*) AS visits
                FROM visits
                WHERE created_at BETWEEN :s AND :e AND is_valid
                GROUP BY 1
                ORDER BY visits DESC
                LIMIT 8
                """
            ),
            {"s": start, "e": end},
        )).mappings().all()

    valid_visits = int(v["valid"] or 0)
    valid_orders = int(o["valid"] or 0)
    cvr = (valid_orders / valid_visits) if valid_visits else 0.0

    return {
        "range": {"from": start.date().isoformat(), "to": end.date().isoformat()},
        "visits": {
            "total": int(v["total"] or 0),
            "valid": valid_visits,
            "vpn": int(v["vpn"] or 0),
            "sessions_total": int(v["total_sessions"] or 0),
            "sessions_valid": int(v["valid_sessions"] or 0),
        },
        "orders": {
            "total": int(o["total"] or 0),
            "valid": valid_orders,
            "revenue": float(o["revenue"] or 0),
            "by_status": {
                "pending":   int(o["pending"] or 0),
                "confirmed": int(o["confirmed"] or 0),
                "shipped":   int(o["shipped"] or 0),
                "delivered": int(o["delivered"] or 0),
                "cancelled": int(o["cancelled"] or 0),
            },
        },
        "conversion_rate": cvr,
        "daily": [dict(r) for r in daily_rows],
        "top_cities": [dict(r) for r in cities],
        "top_sources": [dict(r) for r in sources],
    }


# ---------------------------------------------------------------- orders
@router.get("/orders")
async def list_orders(
    _: Annotated[str, Depends(require_admin)],
    date_from: str | None = Query(default=None, alias="from"),
    date_to: str | None = Query(default=None, alias="to"),
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = None,
    show_vpn: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
) -> dict[str, Any]:
    start, end = _parse_range(date_from, date_to)
    offset = (page - 1) * page_size

    where = ["created_at BETWEEN :s AND :e"]
    params: dict[str, Any] = {"s": start, "e": end}
    if not show_vpn:
        where.append("is_vpn = false")
    if status_filter and status_filter in ALLOWED_STATUSES:
        where.append("status = :status")
        params["status"] = status_filter
    if q:
        where.append(
            "(order_number ILIKE :q OR customer_name ILIKE :q OR phone_e164 ILIKE :q OR phone_raw ILIKE :q OR city ILIKE :q)"
        )
        params["q"] = f"%{q}%"

    where_sql = " AND ".join(where)

    async with AsyncSessionLocal() as session:
        total = (await session.execute(
            text(f"SELECT COUNT(*) FROM orders WHERE {where_sql}"),
            params,
        )).scalar_one()

        rows = (await session.execute(
            text(
                f"""
                SELECT id, order_number, status, customer_name, phone_e164, phone_raw,
                       country, currency, total, payment_method, geo_country, geo_city,
                       is_vpn, city, address, courier, tracking_number, admin_notes,
                       created_at
                FROM orders
                WHERE {where_sql}
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
                """
            ),
            {**params, "limit": page_size, "offset": offset},
        )).mappings().all()

    return {
        "total": int(total),
        "page": page,
        "page_size": page_size,
        "items": [_row(r) for r in rows],
    }


@router.get("/orders/{order_id}")
async def order_detail(
    order_id: str,
    _: Annotated[str, Depends(require_admin)],
) -> dict[str, Any]:
    async with AsyncSessionLocal() as session:
        order = (await session.execute(
            text(
                """
                SELECT id, order_number, status, customer_name, phone_e164, phone_raw,
                       country, currency, total, payment_method, geo_country, geo_city,
                       ip_address, is_vpn, city, address, courier, tracking_number,
                       admin_notes, cancellation_reason, payload,
                       confirmed_at, shipped_at, delivered_at, cancelled_at,
                       created_at, updated_at
                FROM orders WHERE id = :id
                """
            ),
            {"id": order_id},
        )).mappings().first()
        if not order:
            raise HTTPException(status_code=404, detail="order not found")

        items = (await session.execute(
            text(
                """
                SELECT id, product_slug, product_name, offer_label, quantity, price, is_upsell
                FROM order_items WHERE order_id = :id ORDER BY created_at ASC
                """
            ),
            {"id": order_id},
        )).mappings().all()

    return {"order": _row(order, full=True), "items": [dict(i) for i in items]}


class OrderUpdate(BaseModel):
    status: Literal[
        "pending_confirmation", "confirmed", "shipped", "delivered",
        "cancelled", "returned", "no_answer",
    ] | None = None
    admin_notes: str | None = None
    courier: str | None = None
    tracking_number: str | None = None
    cancellation_reason: str | None = None


@router.patch("/orders/{order_id}")
async def update_order(
    order_id: str,
    payload: OrderUpdate,
    _: Annotated[str, Depends(require_admin)],
) -> dict[str, Any]:
    sets: list[str] = []
    params: dict[str, Any] = {"id": order_id}

    if payload.status is not None:
        sets.append("status = :status")
        params["status"] = payload.status
        # set timestamp shortcut
        ts_field = {
            "confirmed": "confirmed_at",
            "shipped":   "shipped_at",
            "delivered": "delivered_at",
            "cancelled": "cancelled_at",
        }.get(payload.status)
        if ts_field:
            sets.append(f"{ts_field} = COALESCE({ts_field}, now())")
    if payload.admin_notes is not None:
        sets.append("admin_notes = :admin_notes")
        params["admin_notes"] = payload.admin_notes
    if payload.courier is not None:
        sets.append("courier = :courier")
        params["courier"] = payload.courier
    if payload.tracking_number is not None:
        sets.append("tracking_number = :tracking_number")
        params["tracking_number"] = payload.tracking_number
    if payload.cancellation_reason is not None:
        sets.append("cancellation_reason = :cancellation_reason")
        params["cancellation_reason"] = payload.cancellation_reason

    if not sets:
        raise HTTPException(status_code=400, detail="nothing to update")

    sets.append("updated_at = now()")
    sql = f"UPDATE orders SET {', '.join(sets)} WHERE id = :id RETURNING id"

    async with AsyncSessionLocal() as session:
        res = (await session.execute(text(sql), params)).first()
        if not res:
            raise HTTPException(status_code=404, detail="order not found")
        await session.commit()

    return {"ok": True}


# ---------------------------------------------------------------- helpers
def _row(r: Any, *, full: bool = False) -> dict[str, Any]:
    d = dict(r)
    for key in ("id",):
        if key in d and d[key] is not None:
            d[key] = str(d[key])
    for key in ("created_at", "updated_at", "confirmed_at", "shipped_at", "delivered_at", "cancelled_at"):
        if key in d and d[key] is not None:
            d[key] = d[key].isoformat()
    if "total" in d and d["total"] is not None:
        d["total"] = float(d["total"])
    return d
