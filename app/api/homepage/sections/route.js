import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import { getSettings, updateSettings } from "@/server/repositories/settings-repository";
import { revalidatePath } from "next/cache";

export async function GET() {
  const access = await requirePermission("hero");
  if (access.error) {
    return access.error;
  }

  const settings = await getSettings();
  return NextResponse.json({ data: settings.homepage.sections });
}

export async function PUT(request) {
  const access = await requirePermission("hero");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const settings = await updateSettings({
      homepage: {
        sections: payload.sections,
      },
    });

    revalidatePath("/", "layout");
    return NextResponse.json({ data: settings.homepage.sections });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to save homepage sections." }, { status: 400 });
  }
}
