import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "NOT FOUND";

  return NextResponse.json({
    detectedIp: clientIp,
    relevantHeaders: {
      "x-forwarded-for": request.headers.get("x-forwarded-for"),
      "x-real-ip": request.headers.get("x-real-ip"),
      "x-vercel-ip-country": request.headers.get("x-vercel-ip-country"),
      "cf-ipcountry": request.headers.get("cf-ipcountry"),
      "cf-connecting-ip": request.headers.get("cf-connecting-ip"),
      "x-client-ip": request.headers.get("x-client-ip"),
      "true-client-ip": request.headers.get("true-client-ip"),
    },
    allHeaders: headers,
  });
}
