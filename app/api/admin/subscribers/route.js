import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";
import { requirePermission } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const access = await requirePermission("subscribers");
  if (access.error) {
    return access.error;
  }

  try {
    const subscribers = await readCollection("subscribers.json", []);
    return NextResponse.json({ data: subscribers });
  } catch (err) {
    console.error("Fetch subscribers error:", err);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const access = await requirePermission("subscribers");
  if (access.error) {
    return access.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing subscriber ID" }, { status: 400 });
    }

    let subscribers = await readCollection("subscribers.json", []);
    subscribers = subscribers.filter((sub) => sub.id !== id);
    await writeCollection("subscribers.json", subscribers);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete subscriber error:", err);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}
