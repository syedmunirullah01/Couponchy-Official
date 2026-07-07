import { NextResponse } from "next/server";
import { getCompanyContent } from "@/server/repositories/company-repository";

export async function GET() {
  const content = await getCompanyContent();
  return NextResponse.json({ data: content });
}
