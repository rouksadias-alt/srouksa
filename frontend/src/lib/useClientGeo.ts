"use client";

import { useEffect, useState } from "react";

export type ClientGeo = {
  country: string | null;
  city: string | null;
  is_allowed: boolean;
};

export function useClientGeo(): ClientGeo | null {
  const [geo, setGeo] = useState<ClientGeo | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    const ctrl = new AbortController();
    fetch(`${apiUrl}/api/geo`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setGeo({
          country: data.country ?? null,
          city: data.city ?? null,
          is_allowed: Boolean(data.is_allowed),
        });
      })
      .catch(() => null);
    return () => ctrl.abort();
  }, []);

  return geo;
}
