import { NextResponse } from "next/server";
import { uploadImageBuffer } from "@/server/cloudinary";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for blog images
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const blogTitle = String(formData.get("title") || "blog-image");
    const sanitizedTitle = blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Image must be PNG, JPG, WEBP, or GIF." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExtension = file.name ? file.name.split(".").pop() : (file.type.split("/")[1] || "png");
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const uploadResult = await uploadImageBuffer(buffer, {
      folder: "couponchy/blogs",
      public_id: `${sanitizedTitle}-${uniqueId}.${fileExtension}`,
      contentType: file.type,
      resource_type: "image",
    });

    return NextResponse.json({
      data: {
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to upload blog image." }, { status: 500 });
  }
}
