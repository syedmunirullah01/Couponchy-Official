import { NextResponse } from "next/server";
import { uploadImageBuffer } from "@/server/cloudinary";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const slug = String(formData.get("slug") || "store-logo");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Logo file is required." }, { status: 400 });
    }

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Logo must be PNG, JPG, WEBP, or SVG." }, { status: 400 });
    }

    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json({ error: "Logo must be 2MB or smaller." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExtension = file.name ? file.name.split(".").pop() : (file.type.split("/")[1] || "png");
    const uploadResult = await uploadImageBuffer(buffer, {
      folder: "couponchy/stores",
      public_id: `${slug}.${fileExtension}`,
      contentType: file.type,
      overwrite: true,
      resource_type: "image",
    });

    return NextResponse.json({
      data: {
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to upload logo." }, { status: 500 });
  }
}
