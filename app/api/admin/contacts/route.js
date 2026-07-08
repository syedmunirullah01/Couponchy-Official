import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/database/json-store";
import { requirePermission } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const access = await requirePermission("contacts");
  if (access.error) {
    return access.error;
  }

  try {
    const contacts = await readCollection("contacts.json", []);
    return NextResponse.json({ data: contacts });
  } catch (err) {
    console.error("Fetch contacts error:", err);
    return NextResponse.json({ error: "Failed to fetch contact submissions" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const access = await requirePermission("contacts");
  if (access.error) {
    return access.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing submission ID" }, { status: 400 });
    }

    let contacts = await readCollection("contacts.json", []);
    contacts = contacts.filter((c) => c.id !== id);
    await writeCollection("contacts.json", contacts);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete contact error:", err);
    return NextResponse.json({ error: "Failed to delete contact submission" }, { status: 500 });
  }
}
