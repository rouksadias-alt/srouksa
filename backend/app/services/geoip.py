"""MaxMind GeoLite2 lookup. Singleton reader, lazy loaded, thread-safe."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Optional

import geoip2.database
import geoip2.errors

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GeoLookup:
    ip: str
    country: Optional[str]
    country_name: Optional[str]
    city: Optional[str]
    postal: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    time_zone: Optional[str]
    is_allowed: bool

    def to_dict(self) -> dict:
        return {
            "ip": self.ip,
            "country": self.country,
            "country_name": self.country_name,
            "city": self.city,
            "postal": self.postal,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "time_zone": self.time_zone,
            "is_allowed": self.is_allowed,
        }


class GeoIPReader:
    _instance: "GeoIPReader | None" = None
    _lock = Lock()

    def __init__(self) -> None:
        self._reader: geoip2.database.Reader | None = None
        self._db_path: Path | None = None

    @classmethod
    def instance(cls) -> "GeoIPReader":
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def open(self) -> None:
        settings = get_settings()
        path = Path(settings.maxmind_db_path)
        if not path.exists():
            logger.warning("MaxMind DB not found at %s; geo lookups will be disabled", path)
            return
        if self._reader is not None and self._db_path == path:
            return
        self.close()
        self._reader = geoip2.database.Reader(str(path))
        self._db_path = path
        logger.info("GeoIP DB loaded from %s", path)

    def close(self) -> None:
        if self._reader is not None:
            try:
                self._reader.close()
            except Exception:
                pass
        self._reader = None
        self._db_path = None

    def lookup(self, ip: str | None) -> GeoLookup:
        settings = get_settings()
        allowed = settings.allowed_country_list
        if not ip or ip in {"127.0.0.1", "::1"} or ip.startswith(("10.", "192.168.", "172.")):
            return GeoLookup(
                ip=ip or "",
                country=None,
                country_name=None,
                city=None,
                postal=None,
                latitude=None,
                longitude=None,
                time_zone=None,
                is_allowed=True,
            )

        if self._reader is None:
            return GeoLookup(
                ip=ip,
                country=None,
                country_name=None,
                city=None,
                postal=None,
                latitude=None,
                longitude=None,
                time_zone=None,
                is_allowed=True,
            )

        try:
            r = self._reader.city(ip)
        except (geoip2.errors.AddressNotFoundError, ValueError):
            return GeoLookup(
                ip=ip,
                country=None,
                country_name=None,
                city=None,
                postal=None,
                latitude=None,
                longitude=None,
                time_zone=None,
                is_allowed=True,
            )

        country = r.country.iso_code
        return GeoLookup(
            ip=ip,
            country=country,
            country_name=r.country.name,
            city=r.city.name,
            postal=r.postal.code,
            latitude=r.location.latitude,
            longitude=r.location.longitude,
            time_zone=r.location.time_zone,
            is_allowed=(not allowed) or (country in allowed) if country else True,
        )


def get_client_ip(headers: dict | None, fallback: str | None) -> str | None:
    """Extract client IP, respecting reverse proxy headers (Easypanel/Traefik)."""
    if headers:
        xff = headers.get("x-forwarded-for") or headers.get("X-Forwarded-For")
        if xff:
            return xff.split(",")[0].strip()
        real = headers.get("x-real-ip") or headers.get("X-Real-IP")
        if real:
            return real.strip()
    return fallback
