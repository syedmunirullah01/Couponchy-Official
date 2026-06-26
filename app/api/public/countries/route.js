import { NextResponse } from "next/server";
import { getSettings } from "@/server/repositories/settings-repository";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ data: settings.general.countries || [] });
}
