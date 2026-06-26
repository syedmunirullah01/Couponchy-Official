import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import { deleteEvent, getEventBySlug, updateEvent } from "@/server/repositories/events-repository";
import { validateEventPayload } from "@/lib/validators";

export async function GET(_request, { params }) {
  const access = await requirePermission("events");
  if (access.error) {
    return access.error;
  }

  const resolvedParams = await params;
  const event = await getEventBySlug(resolvedParams.slug);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json({ data: event });
}

export async function PUT(request, { params }) {
  const access = await requirePermission("events");
  if (access.error) {
    return access.error;
  }

  try {
    const resolvedParams = await params;
    const payload = await request.json();
    const validationError = validateEventPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const event = await updateEvent(resolvedParams.slug, payload);

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json({ data: event });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update event." }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const access = await requirePermission("events");
  if (access.error) {
    return access.error;
  }

  const resolvedParams = await params;
  const deleted = await deleteEvent(resolvedParams.slug);

  if (!deleted) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json({ data: { deleted: true } });
}
