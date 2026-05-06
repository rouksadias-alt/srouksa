# Easypanel Deployment

Step-by-step deployment l Easypanel host li 3andek (`numapetstore` project, m3a Postgres déjà running 3la `numapetstore_database`).

## 1. Pre-requisites

- Easypanel host m3a Docker.
- Postgres service `numapetstore_database` déjà running (database: `numapetstore`, user: `numapetstore`).
- DNS:
  - `numapet.store` → Easypanel host
  - `api.numapet.store` → Easypanel host
- Repo dyalk f GitHub mreboutiya m3a Easypanel (GitHub App).

## 2. Service: backend (FastAPI)

Easypanel UI → **+ Service → App → From GitHub**.

| Field | Value |
|---|---|
| Name | `backend` |
| Repo | `<owner>/panama-custom-store` |
| Branch | `main` |
| Build Path | `/backend` |
| Build Method | Dockerfile (`Dockerfile`) |
| Port | `8000` |

### Domain
- `api.numapet.store` → port `8000` (Auto SSL ON).

### Volume (mohim l MaxMind)

Easypanel → Service `backend` → **Mounts** → Add Volume:
- Name: `geoip-data`
- Mount Path: `/data/geoip`

Hadi bach `.mmdb` file y‑surviv‑i restarts.

### Environment

```env
APP_ENV=production
APP_NAME=Numapetstore API
PUBLIC_SITE_URL=https://numapet.store
PUBLIC_API_URL=https://api.numapet.store
DATABASE_URL=postgres://numapetstore:numapetstore@numapetstore_database:5432/numapetstore?sslmode=disable
CORS_ORIGINS=https://numapet.store
GOOGLE_SHEETS_WEBHOOK_URL=
GOOGLE_SHEETS_WEBHOOK_SECRET=
META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
TIKTOK_PIXEL_ID=
TIKTOK_ACCESS_TOKEN=
SNAP_PIXEL_ID=
SNAP_AD_ACCOUNT_ID=
SNAP_ACCESS_TOKEN=

MAXMIND_ACCOUNT_ID=<from maxmind.com>
MAXMIND_LICENSE_KEY=<secret>
MAXMIND_EDITION_IDS=GeoLite2-City
MAXMIND_DB_PATH=/data/geoip/GeoLite2-City.mmdb
GEO_ALLOWED_COUNTRIES=PA
```

> **MaxMind setup**: signup free f [maxmind.com](https://www.maxmind.com/en/geolite2/signup) → Account → Manage License Keys → Generate. Backend container kaydownloadi `.mmdb` automatic 3la `/data/geoip/` 7it kayredemarra (via `geoipupdate`).

> **Tahdir**: `*_ACCESS_TOKEN` w `*_SECRET` ma t‑commitihomch f git. 3marhom direct f Easypanel UI.

### Health Check
- Path: `/api/health`
- Expected: `200` m3a `{"status":"ok"}`.

## 3. Service: frontend (Next.js)

Easypanel UI → **+ Service → App → From GitHub**.

| Field | Value |
|---|---|
| Name | `frontend` |
| Repo | `<owner>/panama-custom-store` |
| Branch | `main` |
| Build Path | `/frontend` |
| Build Method | Dockerfile (`Dockerfile`) |
| Port | `3000` |

### Domain
- `numapet.store` → port `3000` (Auto SSL ON).
- (Optional) redirect `www.numapet.store` → `numapet.store`.

### Build Args (mohimin — kayban f browser bundle)

Easypanel: **Build → Build Args** (machi Environment, hadi khassha takoun fl wa9t l‑build):

```env
NEXT_PUBLIC_SITE_URL=https://numapet.store
NEXT_PUBLIC_API_URL=https://api.numapet.store
NEXT_PUBLIC_META_PIXEL_ID=<pixel_id>
NEXT_PUBLIC_TIKTOK_PIXEL_ID=<pixel_id>
NEXT_PUBLIC_SNAP_PIXEL_ID=<pixel_id>
NEXT_PUBLIC_WHATSAPP_NUMBER=50760000000
```

### Environment (runtime — optional fallback)

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://numapet.store
NEXT_PUBLIC_API_URL=https://api.numapet.store
```

> **3labalek**: Ila bdelti `NEXT_PUBLIC_*`, khass **rebuild** kamel (machi ghir restart) — Next.js kaybakihom f static bundle.

## 4. Network

Frontend w backend khassom ykounou f **nafs project network** dyal Postgres (`numapetstore_*`) bach backend ywsel l `numapetstore_database:5432`. Easypanel kayhandlilek hadshi auto ila kanou f nafs project.

## 5. Order dyal Deploy

1. Backend l‑awal — sennah ytemma deploy + health check vert.
2. Frontend mn ba3d — `next build` kayhtaj `NEXT_PUBLIC_API_URL` ykoun valid (lina kaybakih).

## 6. Verification

```bash
curl https://api.numapet.store/api/health
curl -I https://numapet.store/
```

Test commande COD mn site:
- Homepage tloadi
- Click product → Add to cart → Checkout
- Sift order → ja lik order_number
- Easypanel logs `backend` → kayban POST `/api/orders` 200
- Postgres → `SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;`

## 7. Rotation / Mises à jour

- Push l `main` → Easypanel auto‑rebuild (ila Auto Deploy ON).
- Manual rebuild: Easypanel UI → Service → **Deploy**.

## 8. Backup Postgres

Easypanel → Postgres service → **Backups** → schedule daily. Stocki off‑host (S3/B2) ila bghiti tbe3d.
