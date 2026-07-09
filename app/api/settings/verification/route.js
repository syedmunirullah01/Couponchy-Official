import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import fs from "fs/promises";
import path from "path";

// Allowed extensions and maximum size (1MB)
const ALLOWED_EXTENSIONS = [".html", ".txt"];
const MAX_SIZE_BYTES = 1024 * 1024; // 1MB

// Helper to sanitize filename and prevent directory traversal
function sanitizeFilename(filename) {
  const parsed = path.parse(filename);
  const cleanName = parsed.name.replace(/[^a-zA-Z0-9-_]/g, "");
  const cleanExt = parsed.ext.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(cleanExt)) {
    return null;
  }
  return `${cleanName}${cleanExt}`;
}

export async function GET() {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  try {
    const publicDir = path.join(process.cwd(), "public");
    const files = await fs.readdir(publicDir);

    const verificationFiles = [];
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        const stats = await fs.stat(path.join(publicDir, file));
        if (stats.isFile()) {
          verificationFiles.push({
            name: file,
            size: stats.size,
            updatedAt: stats.mtime.toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ data: verificationFiles });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to list verification files." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const originalName = file.name;
    const sanitizedName = sanitizeFilename(originalName);

    if (!sanitizedName) {
      return NextResponse.json(
        { error: "Invalid file extension. Only .html and .txt are allowed." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the maximum limit of 1MB." },
        { status: 400 }
      );
    }

    const targetPath = path.join(process.cwd(), "public", sanitizedName);
    await fs.writeFile(targetPath, buffer);

    return NextResponse.json({
      success: true,
      file: {
        name: sanitizedName,
        size: buffer.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to upload file." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename parameter is required." }, { status: 400 });
    }

    const sanitizedName = sanitizeFilename(filename);
    if (!sanitizedName) {
      return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
    }

    const targetPath = path.join(process.cwd(), "public", sanitizedName);

    try {
      await fs.access(targetPath);
    } catch {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    await fs.unlink(targetPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to delete file." },
      { status: 500 }
    );
  }
}
