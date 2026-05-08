-- 0002_admin_dashboard.sql
-- Adds page-view tracking + admin operational columns on orders.
-- Idempotent: safe to re-run. Backend also runs these on startup
-- (see backend/app/db.py run_bootstrap_migration), so manual execution is optional.

-- ============================================================
-- Visits: one row per public-site page view
-- ============================================================
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    geo_country TEXT,
    geo_city TEXT,
    is_vpn BOOLEAN NOT NULL DEFAULT false,
    is_valid BOOLEAN NOT NULL DEFAULT false, -- country in allowed list AND not VPN
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    fbclid TEXT,
    ttclid TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_created_at  ON visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_is_valid    ON visits(is_valid);
CREATE INDEX IF NOT EXISTS idx_visits_session     ON visits(session_id);
CREATE INDEX IF NOT EXISTS idx_visits_geo_country ON visits(geo_country);

-- ============================================================
-- Orders: admin-side operational columns
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at       TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at         TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at       TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at       TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier            TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_vpn             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address            TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city               TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id         TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_geo_country ON orders(geo_country);
CREATE INDEX IF NOT EXISTS idx_orders_is_vpn     ON orders(is_vpn);
