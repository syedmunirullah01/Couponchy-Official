import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { storeName, offerTitle } = await request.json();

    const notifications = await readCollection("notifications.json", []);
    const now = Date.now();
    const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days retention to allow daily historical sorting!

    const newNotification = {
      id: `notif_affiliate_${Math.random().toString(36).slice(2, 10)}`,
      type: "affiliate_click",
      storeName: storeName || "Unknown Store",
      offerTitle: offerTitle || "Unknown Offer",
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifications.unshift(newNotification);

    // Filter active and slice to max 1000 to hold a good amount of history for date sorting
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
