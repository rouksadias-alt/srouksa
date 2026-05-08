from functools import lru_cache

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "Numapetstore API"
    public_site_url: AnyHttpUrl = "https://numapet.store"
    public_api_url: AnyHttpUrl = "https://api.numapet.store"
    database_url: str
    cors_origins: str = "http://localhost:3000,https://numapet.store"
    google_sheets_webhook_url: str | None = None
    google_sheets_webhook_secret: str | None = None
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    meta_pixel_id: str | None = None
    meta_capi_access_token: str | None = None
    tiktok_pixel_id: str | None = None
    tiktok_access_token: str | None = None
    snap_pixel_id: str | None = None
    snap_access_token: str | None = None
    snap_ad_account_id: str | None = None

    maxmind_account_id: str | None = None
    maxmind_license_key: str | None = None
    maxmind_db_path: str = "/data/geoip/GeoLite2-City.mmdb"
    geo_allowed_countries: str = "PA"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

        parts = urlsplit(url)
        query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if k.lower() != "sslmode"]
        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_country_list(self) -> list[str]:
        return [c.strip().upper() for c in self.geo_allowed_countries.split(",") if c.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
