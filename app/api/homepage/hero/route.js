import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import { getSettings, updateSettings } from "@/server/repositories/settings-repository";
import { revalidatePath } from "next/cache";
import { translateSettingsOnSave } from "@/server/services/translation-service";

export async function GET() {
  const access = await requirePermission("hero");
  if (access.error) {
    return access.error;
  }

  const settings = await getSettings();
  return NextResponse.json({ data: settings.homepage.hero });
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
        hero: payload.hero,
      },
    });

    // Trigger background translation for all changed hero text fields
    translateSettingsOnSave(settings).catch((err) =>
      console.error("[PUT /api/homepage/hero] Auto translation failed:", err)
    );

    revalidatePath("/", "layout");
    return NextResponse.json({ data: settings.homepage.hero });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to save hero settings." }, { status: 400 });
  }
}
