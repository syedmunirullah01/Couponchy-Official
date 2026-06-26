import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import { createEvent, getAllEvents } from "@/server/repositories/events-repository";
import { validateEventPayload } from "@/lib/validators";

export async function GET() {
  const access = await requirePermission("events");
  if (access.error) {
    return access.error;
  }

  const events = await getAllEvents();
  return NextResponse.json({ data: events });
}

export async function POST(request) {
  const access = await requirePermission("events");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const validationError = validateEventPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const event = await createEvent(payload);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create event." }, { status: 400 });
  }
}
