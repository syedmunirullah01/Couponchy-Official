import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
    }

    const subscribers = await readCollection("subscribers.json", []);
    
    // Check if duplicate
    const isDuplicate = subscribers.some((sub) => sub.email === email);
    if (isDuplicate) {
      return NextResponse.json({ message: "This email is already subscribed!" }, { status: 400 });
    }

    const newSub = {
      id: `sub_${Math.random().toString(36).slice(2, 10)}`,
      email,
      subscribedAt: new Date().toISOString(),
    };

    subscribers.push(newSub);
    await writeCollection("subscribers.json", subscribers);

    // Save a new notification for the admin panel
    try {
      const notifications = await readCollection("notifications.json", []);
      const now = Date.now();
      const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

      const newNotification = {
        id: `notif_sub_${Math.random().toString(36).slice(2, 10)}`,
        type: "subscriber",
        email,
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
    } catch (notifErr) {
      console.error("Failed to save subscriber notification:", notifErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscription error:", err);
    return NextResponse.json({ message: "Failed to subscribe." }, { status: 500 });
  }
}
