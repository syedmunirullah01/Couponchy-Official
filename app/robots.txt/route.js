import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";

  try {
    const { data, error } = await supabase.storage
      .from("couponchy")
      .download("verification/robots.txt");

    if (!error && data) {
      const content = await data.text();
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        },
      });
    }
  } catch (e) {
    console.error("Failed to load custom robots.txt from storage:", e);
  }

  const robotsLines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin/",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`
  ];

  return new NextResponse(robotsLines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    },
  });
}
