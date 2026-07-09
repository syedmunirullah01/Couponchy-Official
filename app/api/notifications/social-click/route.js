import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { storeName, platform } = await request.json();

    const notifications = await readCollection("notifications.json", []);
    const now = Date.now();
    const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

    const newNotification = {
      id: `notif_social_${Math.random().toString(36).slice(2, 10)}`,
      type: "social_click",
      storeName: storeName || "Unknown Store",
      platform: platform || "Social Media",
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifications.unshift(newNotification);

    // Filter active and slice to max 100
    const active = notifications.filter(
      (n) => now - new Date(n.createdAt).getTime() < RETENTION_MS
    );
    const trimmed = active.slice(0, 100);

    await writeCollection("notifications.json", trimmed);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save social click notification:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
