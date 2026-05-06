import { headers } from "next/headers";

export type GeoInfo = {
  ip: string;
  country: string | null;
  country_name: string | null;
  city: string | null;
  postal: string | null;
  latitude: number | null;
  longitude: number | null;
  time_zone: string | null;
  is_allowed: boolean;
};

const FALLBACK: GeoInfo = {
  ip: "",
  country: null,
  country_name: null,
  city: null,
  postal: null,
  latitude: null,
  longitude: null,
  time_zone: null,
  is_allowed: true,
};

export async function fetchGeo(): Promise<GeoInfo> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return FALLBACK;

  const h = await headers();
  const xff = h.get("x-forwarded-for") ?? "";
  const xri = h.get("x-real-ip") ?? "";

  try {
    const res = await fetch(`${apiUrl}/api/geo`, {
      headers: {
        ...(xff ? { "x-forwarded-for": xff } : {}),
        ...(xri ? { "x-real-ip": xri } : {}),
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK;
    return (await res.json()) as GeoInfo;
  } catch {
    return FALLBACK;
  }
}
