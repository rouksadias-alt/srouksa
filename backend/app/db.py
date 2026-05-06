from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy import text

from app.core.config import get_settings

settings = get_settings()
engine = create_async_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def run_bootstrap_migration() -> None:
    async with engine.begin() as conn:
        await conn.execute(text("""
        CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_number TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending_confirmation',
            customer_name TEXT NOT NULL,
            phone_raw TEXT NOT NULL,
            phone_e164 TEXT NOT NULL,
            country TEXT NOT NULL DEFAULT 'PA',
            currency TEXT NOT NULL DEFAULT 'USD',
            total NUMERIC NOT NULL DEFAULT 0,
            payment_method TEXT NOT NULL DEFAULT 'COD',
            event_id TEXT,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            ip_address TEXT,
            geo_country TEXT,
            geo_city TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """))
        await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS ip_address TEXT;"))
        await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS geo_country TEXT;"))
        await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS geo_city TEXT;"))
        await conn.execute(text("""
        CREATE TABLE IF NOT EXISTS order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_slug TEXT NOT NULL,
            product_name TEXT NOT NULL,
            offer_label TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price NUMERIC NOT NULL,
            is_upsell BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """))
        await conn.execute(text("""
        CREATE TABLE IF NOT EXISTS tracking_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID,
            event_name TEXT NOT NULL,
            event_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            response JSONB,
            success BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """))
