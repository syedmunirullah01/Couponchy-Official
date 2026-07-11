import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";
import { requirePermission } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  try {
    const ignoredIps = await readCollection("ignored_ips.json", []);
    
    // Resolve caller's client IP
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     request.headers.get("x-real-ip")?.trim() || 
                     "127.0.0.1";

    return NextResponse.json({ 
      ignoredIps, 
      clientIp,
      debugHeaders: Object.fromEntries(request.headers.entries())
    });
  } catch (err) {
    console.error("Fetch ignored IPs error:", err);
    return NextResponse.json({ error: "Failed to fetch ignored IPs" }, { status: 500 });
  }
}

export async function POST(request) {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  try {
    const { action, ip } = await request.json();

    if (!ip || typeof ip !== "string") {
      return NextResponse.json({ error: "Invalid IP address" }, { status: 400 });
    }

    const cleanIp = ip.trim();
    let ignoredIps = await readCollection("ignored_ips.json", []);

    if (action === "add") {
      if (!ignoredIps.includes(cleanIp)) {
        ignoredIps.push(cleanIp);
      }
    } else if (action === "remove") {
      ignoredIps = ignoredIps.filter((item) => item !== cleanIp);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await writeCollection("ignored_ips.json", ignoredIps);

    return NextResponse.json({ success: true, ignoredIps });
  } catch (err) {
    console.error("Update ignored IPs error:", err);
    return NextResponse.json({ error: "Failed to update ignored IPs" }, { status: 500 });
  }
}
