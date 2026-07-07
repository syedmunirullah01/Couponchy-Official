import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request) {
  try {
    const { storeName, offerTitle, feedback } = await request.json();
    
    // Read notifications collection
    const notifications = await readCollection("notifications.json", []);
    const now = Date.now();
    
    const newNotification = {
      id: `notif_${Math.random().toString(36).slice(2, 10)}`,
      type: "feedback",
      storeName: storeName || "Unknown Store",
      offerTitle: offerTitle || "Unknown Offer",
      feedback: feedback, // 'yes' or 'no'
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    // Add to top of list
    notifications.unshift(newNotification);
    
    // Filter out notifications older than 24 hours
    const active = notifications.filter(
      (n) => now - new Date(n.createdAt).getTime() < RETENTION_MS
    );
    
    // Keep max 100 notifications to prevent file growth
    const trimmed = active.slice(0, 100);
    
    await writeCollection("notifications.json", trimmed);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating feedback notification:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
