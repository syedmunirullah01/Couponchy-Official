import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

export const dynamic = "force-dynamic";

async function getCountryFromRequest(request, bodyCountryCode) {
  // 1. Use countryCode sent directly from client in POST body (most accurate)
  if (bodyCountryCode && bodyCountryCode.length === 2) {
    return bodyCountryCode.toUpperCase();
  }

  // 2. Read from couponchy_country cookie (set by middleware)
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)couponchy_country=([A-Za-z]{2})/);
  if (cookieMatch && cookieMatch[1]) {
    return cookieMatch[1].toUpperCase();
  }

  // 3. Use CDN/proxy country header (Vercel, Cloudflare, etc.)
  const countryHeader =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code") ||
    request.headers.get("x-country");
  if (countryHeader && countryHeader.length === 2) {
    return countryHeader.toUpperCase();
  }

  return "US";
}


export async function POST(request) {
  try {
    const { storeName, platform, countryCode: bodyCountryCode } = await request.json();

    const countryCode = await getCountryFromRequest(request, bodyCountryCode);

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
