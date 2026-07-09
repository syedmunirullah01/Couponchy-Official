import { NextResponse } from "next/server";

// This endpoint is not used — homepage translation runs via the standalone script:
// node scratch/run-homepage-migration.js
export async function POST() {
  return NextResponse.json({
    message: "Use the standalone script: node scratch/run-homepage-migration.js",
  });
}

export const dynamic = "force-dynamic";
