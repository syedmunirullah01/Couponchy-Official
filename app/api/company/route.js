import { NextResponse } from "next/server";
import { getCompanyContent, updateCompanyContent } from "@/server/repositories/company-repository";
import { requirePermission } from "@/server/auth";
import { revalidatePath } from "next/cache";

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
    return NextResponse.json({ data: content });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to save company content." }, { status: 400 });
  }
}
