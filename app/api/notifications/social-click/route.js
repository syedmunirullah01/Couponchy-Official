import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

export const dynamic = "force-dynamic";

async function getCountryFromRequest(request) {
  // 1. Read from couponchy_country cookie (set by middleware — most reliable on custom servers)
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)couponchy_country=([A-Za-z]{2})/);
  if (cookieMatch && cookieMatch[1]) {
    return cookieMatch[1].toUpperCase();
  }

  // 2. Use CDN/proxy country header (Vercel, Cloudflare, etc.)
  const countryHeader =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code") ||
    request.headers.get("x-country");
  if (countryHeader && countryHeader.length === 2) {
    return countryHeader.toUpperCase();
  }

  // 3. Fallback: GeoIP on real client IP (only when proxy correctly forwards it)
  const clientIp =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";

  const isLocal =
    !clientIp ||
    clientIp === "127.0.0.1" ||
    clientIp === "::1" ||
    clientIp.startsWith("127.") ||
    clientIp.startsWith("192.168.") ||
    clientIp.startsWith("10.") ||
    clientIp.startsWith("172.");

  if (!isLocal) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://freeipapi.com/api/json/${clientIp}`, {
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeout);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.countryCode && data.countryCode.length === 2) {
          return data.countryCode.toUpperCase();
        }
      }
    } catch (err) {
      console.error("GeoIP lookup failed:", err.message);
    }
  }

  return "US";
}


export async function POST(request) {
  try {
    const { storeName, platform } = await request.json();

    const countryCode = await getCountryFromRequest(request);

    const notifications = await readCollection("notifications.json", []);
    const now = Date.now();
    const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    const newNotification = {
      id: `notif_social_${Math.random().toString(36).slice(2, 10)}`,
      type: "social_click",
      storeName: storeName || "Unknown Store",
      platform: platform || "Social Media",
      countryCode: countryCode,
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifications.unshift(newNotification);

    const active = notifications.filter(
      (n) => now - new Date(n.createdAt).getTime() < RETENTION_MS
    );
    const trimmed = active.slice(0, 1000);

    await writeCollection("notifications.json", trimmed);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save social click notification:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
