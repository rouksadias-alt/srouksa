from fastapi import APIRouter, Request

from app.services.geoip import GeoIPReader, get_client_ip

router = APIRouter(prefix="/geo")


@router.get("")
async def get_geo(request: Request):
    ip = get_client_ip(dict(request.headers), request.client.host if request.client else None)
    lookup = GeoIPReader.instance().lookup(ip)
    return lookup.to_dict()
