import { NextResponse } from "next/server";
import { getCompanyContent, updateCompanyContent } from "@/server/repositories/company-repository";
import { requirePermission } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { getActiveLanguages, translateAboutOnSave, translateContactOnSave, translatePrivacyOnSave, translateTermsOnSave } from "@/server/services/translation-service";

export async function GET() {
  const access = await requirePermission("company");
  if (access.error) {
    return access.error;
  }

  const content = await getCompanyContent();
  return NextResponse.json({ data: content });
}

export async function PUT(request) {
  const access = await requirePermission("company");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const content = await updateCompanyContent(payload);
    revalidatePath("/", "layout");

    // Await all translations to guarantee Vercel serverless functions complete successfully before freezing
    try {
      const langs = await getActiveLanguages();
      await Promise.all([
        translateAboutOnSave(langs, content.aboutUs || {}).catch((err) => console.error("[company PUT] About auto-translation failed:", err)),
        translateContactOnSave(langs, content.contactUs || {}).catch((err) => console.error("[company PUT] Contact auto-translation failed:", err)),
        translatePrivacyOnSave(langs, content.privacyPolicy || {}).catch((err) => console.error("[company PUT] Privacy auto-translation failed:", err)),
        translateTermsOnSave(langs, content.termsOfService || {}).catch((err) => console.error("[company PUT] Terms auto-translation failed:", err))
      ]);
    } catch (err) {
      console.error("[company PUT] Auto translation orchestrator failed:", err);
    }

    return NextResponse.json({ data: content });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to save company content." }, { status: 400 });
  }
}
