from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, geo, health, orders, tracking, visits
from app.core.config import get_settings
from app.db import run_bootstrap_migration
from app.services.geoip import GeoIPReader

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_bootstrap_migration()
    GeoIPReader.instance().open()
    try:
        yield
    finally:
        GeoIPReader.instance().close()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(geo.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(tracking.router, prefix="/api")
app.include_router(visits.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
