import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { supabase } from "@/lib/supabase";

// Bundled data directory (read-only on Vercel / serverless)
const bundledDir = path.join(process.cwd(), "data", "database");

// Writable directory — local cache
const writableDir = path.join("/tmp", "couponchy-db");

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch { }
}

export async function readCollection(fileName, fallback = []) {
  const tmpPath = path.join(writableDir, fileName);

  // 1. Try to download from Supabase storage first (most up-to-date, shared cloud store)
  try {
    const { data, error } = await supabase.storage
      .from("couponchy")
      .download(`database/${fileName}`);

    if (!error && data) {
      const text = await data.text();
      const records = JSON.parse(text);

      // Cache locally in /tmp for fast fallback
      await ensureDir(writableDir);
      await writeFile(tmpPath, text, "utf8");

      return records;
    }
  } catch (err) {
    // If download or parse fails, fall through to local cache
  }

  // 2. Try to read from local /tmp cache
  try {
    const fileContents = await readFile(tmpPath, "utf8");
    return JSON.parse(fileContents);
  } catch { }

  // 3. Fall back to bundled data/database file
  try {
    const bundledPath = path.join(bundledDir, fileName);
    const fileContents = await readFile(bundledPath, "utf8");
    const records = JSON.parse(fileContents);

    // Seed/Upload the bundled baseline file to Supabase storage for future persistence
    try {
      await supabase.storage
        .from("couponchy")
        .upload(`database/${fileName}`, fileContents, {
          contentType: "application/json",
          upsert: true,
        });
    } catch { }

    return records;
  } catch {
    return fallback;
  }
}

export async function writeCollection(fileName, records) {
  const jsonStr = `${JSON.stringify(records, null, 2)}\n`;

  // 1. Write to local /tmp cache
  try {
    await ensureDir(writableDir);
    await writeFile(path.join(writableDir, fileName), jsonStr, "utf8");
  } catch { }

  // 2. Upload to Supabase Storage (cloud database backup)
  try {
    await supabase.storage
      .from("couponchy")
      .upload(`database/${fileName}`, jsonStr, {
        contentType: "application/json",
        upsert: true,
        cacheControl: "no-cache, no-store, must-revalidate",
      });
  } catch (err) {
    console.error(`Error uploading ${fileName} to Supabase storage:`, err);
  }

  return records;
}

