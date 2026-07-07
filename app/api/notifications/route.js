import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    const notifications = await readCollection("notifications.json", []);
    const now = Date.now();
    
    // Filter out notifications older than 24 hours
    const active = notifications.filter(
      (n) => now - new Date(n.createdAt).getTime() < RETENTION_MS
    );
    
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
    
    // Filter out notifications older than 24 hours, and mark active ones as read
    const active = notifications
      .filter((n) => now - new Date(n.createdAt).getTime() < RETENTION_MS)
      .map((n) => ({ ...n, read: true }));
      
    await writeCollection("notifications.json", active);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications to read:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
