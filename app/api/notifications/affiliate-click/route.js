import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";
import { getAppSession } from "@/server/auth";

export const dynamic = "force-dynamic";

async function getCountryFromRequest(request) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "127.0.0.1";

  // 1. Use CDN/proxy country header if available (Vercel sets this automatically in production)
  const countryHeader =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code") ||
    request.headers.get("x-country");
  if (countryHeader && countryHeader.length === 2) {
    return countryHeader.toUpperCase();
  }

  const isLocal =
    clientIp === "127.0.0.1" ||
    clientIp === "::1" ||
    clientIp.startsWith("127.") ||
    clientIp.startsWith("192.168.") ||
    clientIp.startsWith("10.") ||
    clientIp.startsWith("172.");

  // 2. For local/LAN IPs (dev only), lookup server's own public IP — no caching to avoid cross-user pollution
  // 3. For real public IPs, do direct per-IP lookup
  const lookupUrl = isLocal
    ? "https://freeipapi.com/api/json"
    : `https://freeipapi.com/api/json/${clientIp}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(lookupUrl, { signal: controller.signal }).catch(() => null);
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

  return "US";
}

export async function POST(request) {
  try {
    const { storeName, offerTitle } = await request.json();

    // 1. Auto-exclude logged-in admin clicks
    const session = await getAppSession();
    if (session?.user?.role === "admin") {
      return NextResponse.json({ success: true, ignored: true, reason: "admin_session" });
    }

    // 2. Check client IP against ignored IPs list
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     request.headers.get("x-real-ip")?.trim() || 
                     "127.0.0.1";

    const ignoredIps = await readCollection("ignored_ips.json", []);
    if (ignoredIps.includes(clientIp)) {
      return NextResponse.json({ success: true, ignored: true, reason: "ignored_ip" });
    }

    const countryCode = await getCountryFromRequest(request);

    const notifications = await readCollection("notifications.json", []);
    const now = Date.now();
    const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    const newNotification = {
      id: `notif_affiliate_${Math.random().toString(36).slice(2, 10)}`,
      type: "affiliate_click",
      storeName: storeName || "Unknown Store",
      offerTitle: offerTitle || "Unknown Offer",
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
    console.error("Failed to save affiliate click notification:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
