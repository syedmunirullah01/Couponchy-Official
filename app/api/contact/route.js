import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const subject = String(body?.subject || "").trim();
    const message = String(body?.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const contacts = await readCollection("contacts.json", []);

    const newContact = {
      id: `contact_${Math.random().toString(36).slice(2, 10)}`,
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
    };

    contacts.unshift(newContact); // Newest submissions first
    await writeCollection("contacts.json", contacts);

    // Save a new notification for the admin panel
    try {
      const notifications = await readCollection("notifications.json", []);
      const now = Date.now();
      const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

      const newNotification = {
        id: `notif_contact_${Math.random().toString(36).slice(2, 10)}`,
        type: "contact",
        name,
        email,
        subject,
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
      console.error("Failed to save contact notification:", notifErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form submission error:", err);
    return NextResponse.json({ error: "Failed to submit message." }, { status: 500 });
  }
}
