import json
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.db import AsyncSessionLocal
from app.services.geoip import GeoIPReader, get_client_ip
from app.services.phone import normalize_panama_phone
from app.services.sheets import push_order_async
from app.services.telegram import push_order_async as push_telegram_async
from app.services.vpn import is_vpn

router = APIRouter(prefix="/orders")


class OrderItemIn(BaseModel):
    product_slug: str
    product_name: str
    offer_label: str
    quantity: int = Field(gt=0)
    price: float = Field(ge=0)


class OrderCreate(BaseModel):
    event_id: str
    customer_name: str = Field(min_length=2)
    phone: str
    address: str | None = None
    city: str | None = None
    fast_shipping: bool = False
    shipping_total: float = 0
    currency: str = "USD"
    total: float = Field(ge=0)
    items: list[OrderItemIn]
    tracking: dict[str, Any] = {}
    session_id: str | None = None


@router.post("")
async def create_order(payload: OrderCreate, request: Request):
    phone_e164 = normalize_panama_phone(payload.phone)
    if not phone_e164:
        raise HTTPException(status_code=422, detail="Invalid Panama phone number")

    ip = get_client_ip(
        dict(request.headers),
        request.client.host if request.client else None,
    )
    geo = GeoIPReader.instance().lookup(ip)
    vpn_flag = await is_vpn(ip)

    order_number = f"NMP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    request_payload = payload.model_dump()
    request_payload["ip_address"] = ip
    request_payload["user_agent"] = request.headers.get("user-agent")
    request_payload["geo"] = geo.to_dict()

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("""
            INSERT INTO orders (
                order_number, customer_name, phone_raw, phone_e164,
                currency, total, event_id, payload,
                ip_address, geo_country, geo_city,
                is_vpn, address, city, session_id
            )
            VALUES (
                :order_number, :customer_name, :phone_raw, :phone_e164,
                :currency, :total, :event_id, CAST(:payload AS JSONB),
                :ip_address, :geo_country, :geo_city,
                :is_vpn, :address, :city, :session_id
            )
            RETURNING id
            """),
            {
                "order_number": order_number,
                "customer_name": payload.customer_name,
                "phone_raw": payload.phone,
                "phone_e164": phone_e164,
                "currency": payload.currency,
                "total": payload.total,
                "event_id": payload.event_id,
                "payload": json.dumps(request_payload),
                "ip_address": ip,
                "geo_country": geo.country,
                "geo_city": geo.city,
                "is_vpn": vpn_flag,
                "address": payload.address,
                "city": payload.city,
                "session_id": payload.session_id,
            },
        )
        order_id = result.scalar_one()

        for item in payload.items:
            await session.execute(
                text("""
                INSERT INTO order_items (order_id, product_slug, product_name, offer_label, quantity, price)
                VALUES (:order_id, :product_slug, :product_name, :offer_label, :quantity, :price)
                """),
                {"order_id": order_id, **item.model_dump()},
            )

        await session.commit()

    notification_payload = {
        "order_id": str(order_id),
        "order_number": order_number,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "customer_name": payload.customer_name,
        "phone_raw": payload.phone,
        "phone_e164": phone_e164,
        "address": payload.address or "",
        "city": payload.city or "",
        "currency": payload.currency,
        "total": payload.total,
        "fast_shipping": payload.fast_shipping,
        "shipping_total": payload.shipping_total,
        "event_id": payload.event_id,
        "ip_address": ip,
        "geo_country": geo.country,
        "geo_city": geo.city,
        "items": [item.model_dump() for item in payload.items],
        "items_summary": ", ".join(
            f"{item.quantity}× {item.product_name} ({item.offer_label})"
            for item in payload.items
        ),
    }

    push_order_async(notification_payload)
    push_telegram_async(notification_payload)

    return {
        "ok": True,
        "order_id": str(order_id),
        "order_number": order_number,
        "geo": {"country": geo.country, "is_allowed": geo.is_allowed},
    }


@router.post("/{order_id}/upsell")
async def add_upsell(order_id: str, item: OrderItemIn):
    async with AsyncSessionLocal() as session:
        await session.execute(
            text("""
            INSERT INTO order_items (order_id, product_slug, product_name, offer_label, quantity, price, is_upsell)
            VALUES (:order_id, :product_slug, :product_name, :offer_label, :quantity, :price, true)
            """),
            {"order_id": order_id, **item.model_dump()},
        )
        await session.commit()
    return {"ok": True}
