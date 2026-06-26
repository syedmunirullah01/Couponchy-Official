import { NextResponse } from "next/server";
import { getEnabledEvents } from "@/server/repositories/events-repository";

export async function GET() {
  const events = await getEnabledEvents();
  return NextResponse.json({ data: events });
}
