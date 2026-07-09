import { NextResponse } from "next/server";
import { getEnabledEvents } from "@/server/repositories/events-repository";

import { resolveRequestCountryCode } from "@/server/resolve-request-country";

export async function GET() {
  const [events, countryCode] = await Promise.all([
    getEnabledEvents(),
    resolveRequestCountryCode(),
  ]);
  const currentCountry = String(countryCode || "US").toUpperCase();
  const filteredEvents = events.filter((event) => {
    const eventCountry = String(event.countryCode || "GLOBAL").toUpperCase();
    return eventCountry === "GLOBAL" || eventCountry === currentCountry;
  });
  return NextResponse.json({ data: filteredEvents });
}
