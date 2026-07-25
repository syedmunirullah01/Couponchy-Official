import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import path from "path";

const ALLOWED_EXTENSIONS = [".html", ".txt"];

export async function GET(_request, { params }) {
  const { filename } = await params;

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    notFound();
  }

  try {
    const { data, error } = await supabase.storage
      .from("couponchy")
      .download(`verification/${filename}`);

    if (error || !data) {
      notFound();
    }

    const content = await data.text();
    const contentType = ext === ".html" ? "text/html" : "text/plain";

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      },
    });
  } catch (err) {
    notFound();
  }
}
