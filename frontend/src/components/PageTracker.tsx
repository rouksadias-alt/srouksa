"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_KEY = "nmp_sid";
const SEEN_KEY = "nmp_seen_paths";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid =
        crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    let seen: Record<string, number> = {};
    try {
      seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "{}");
    } catch {}
    const now = Date.now();
    if (seen[fullPath] && now - seen[fullPath] < 30_000) return;
    seen[fullPath] = now;
    try {
      sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch {}

    const body = {
      session_id: getOrCreateSessionId(),
      path: fullPath,
      referrer: document.referrer || null,
      utm_source: searchParams?.get("utm_source") ?? null,
      utm_medium: searchParams?.get("utm_medium") ?? null,
      utm_campaign: searchParams?.get("utm_campaign") ?? null,
      utm_content: searchParams?.get("utm_content") ?? null,
      utm_term: searchParams?.get("utm_term") ?? null,
      fbclid: searchParams?.get("fbclid") ?? null,
      ttclid: searchParams?.get("ttclid") ?? null,
    };

    fetch(`${apiUrl}/api/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => null);
  }, [pathname, searchParams]);

  return null;
}

export function getSessionId(): string {
  return getOrCreateSessionId();
}
