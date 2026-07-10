import { NextResponse } from "next/server";
import { uploadImageBuffer } from "@/server/cloudinary";
import { requirePermission } from "@/server/auth";

const MAX_SIZE = 1 * 1024 * 1024; // 1MB for branding assets
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function POST(request) {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = String(formData.get("type") || "logo"); // "logo" or "favicon"

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File must be PNG, JPG, WEBP, or SVG." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be 1MB or smaller." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExtension = file.name ? file.name.split(".").pop() : (file.type.split("/")[1] || "png");
    
    const uploadResult = await uploadImageBuffer(buffer, {
      folder: "couponchy/branding",
      public_id: `${type}.${fileExtension}`,
      contentType: file.type,
      overwrite: true,
      resource_type: "image",
    });

    return NextResponse.json({
      data: {
        secureUrl: uploadResult.secure_url,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to upload branding asset." }, { status: 500 });
  }
}
