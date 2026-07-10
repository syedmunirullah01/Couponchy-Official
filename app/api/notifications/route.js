import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

const GENERAL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const AFFILIATE_RETENTION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

function filterActiveNotifications(notifications, now) {
  return notifications.filter((n) => {
    const elapsed = now - new Date(n.createdAt).getTime();
    if (n.type === "affiliate_click") {
      return elapsed < AFFILIATE_RETENTION_MS;
    }
    return elapsed < GENERAL_RETENTION_MS;
  });
}

export async function GET() {
  try {
    const notifications = await readCollection("notifications.json", []);
    const now = Date.now();
    
    const active = filterActiveNotifications(notifications, now);
    
    // If some notifications expired, update the stored collection dynamically
    if (active.length !== notifications.length) {
      await writeCollection("notifications.json", active);
    }
    
    return NextResponse.json(active);
  } catch (error) {
    console.error("Error reading notifications:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST() {
  try {
    const notifications = await readCollection("notifications.json", []);
    const now = Date.now();
    
    const active = filterActiveNotifications(notifications, now).map((n) => ({
      ...n,
      read: true,
    }));
      
    await writeCollection("notifications.json", active);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications to read:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
