import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/server/repositories/settings-repository";
import { requirePermission } from "@/server/auth";

export async function GET() {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  const settings = await getSettings();
  return NextResponse.json({ data: settings });
}

export async function PUT(request) {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const settings = await updateSettings(payload);
    return NextResponse.json({ data: settings });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to save settings." }, { status: 400 });
  }
}
