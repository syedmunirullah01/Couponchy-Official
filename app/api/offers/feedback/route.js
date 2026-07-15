import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

export const dynamic = "force-dynamic";

// Cache the server's public country so we don't hit freeipapi on every local request
let _cachedServerCountry = null;
let _cachedServerCountryAt = 0;

async function getCountryFromRequest(request) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   request.headers.get("x-real-ip")?.trim() || 
                   "127.0.0.1";

  // 1. Use CDN/proxy country header if available (production: Vercel, Cloudflare)
  const countryHeader = request.headers.get("x-vercel-ip-country") || 
                        request.headers.get("cf-ipcountry") || 
                        request.headers.get("x-country-code") || 
                        request.headers.get("x-country");
  if (countryHeader && countryHeader.length === 2) {
    return countryHeader.toUpperCase();
  }

  const isLocal = clientIp === "127.0.0.1" || 
                  clientIp === "::1" || 
                  clientIp.includes("127.0.0.1") ||
                  clientIp.startsWith("192.168.") || 
                  clientIp.startsWith("10.") ||
                  clientIp.startsWith("172.");

  // 2. For local/LAN IPs, use cached server country (re-fetch every 10 minutes)
  if (isLocal) {
    const now = Date.now();
    if (_cachedServerCountry && now - _cachedServerCountryAt < 10 * 60 * 1000) {
      return _cachedServerCountry;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("https://freeipapi.com/api/json", {
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeout);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.countryCode && data.countryCode.length === 2) {
          _cachedServerCountry = data.countryCode.toUpperCase();
          _cachedServerCountryAt = now;
          return _cachedServerCountry;
        }
      }
    } catch (err) {
      console.error("GeoIP (local) lookup failed:", err);
    }
    return _cachedServerCountry || "US";
  }

  // 3. For real public IPs, do direct lookup
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
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
    console.error("GeoIP lookup failed:", err);
  }

  return "US";
}

export async function POST(request) {
  try {
    const { storeName, offerTitle, feedback } = await request.json();
    
    const countryCode = await getCountryFromRequest(request);

    const notifications = await readCollection("notifications.json", []);
    const now = Date.now();
    const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    const newNotification = {
      id: `notif_${Math.random().toString(36).slice(2, 10)}`,
      type: "feedback",
      storeName: storeName || "Unknown Store",
      offerTitle: offerTitle || "Unknown Offer",
      feedback: feedback, // 'yes' or 'no'
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
    console.error("Error creating feedback notification:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
