import "server-only";

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Bundled data directory (read-only on Vercel / serverless)
const bundledDir = path.join(process.cwd(), "data", "database");

// Writable directory — /tmp is always writable, even on Vercel
const writableDir = path.join("/tmp", "couponchy-db");

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

/**
 * Returns the best path to READ from:
 * 1. /tmp/couponchy-db/<fileName> — if admin has written changes during this instance
 * 2. data/database/<fileName>     — bundled fallback (committed to git, permanent baseline)
 */
async function readablePath(fileName) {
  const tmp = path.join(writableDir, fileName);
  try {
    await access(tmp);
    return tmp;
  } catch {
    return path.join(bundledDir, fileName);
  }
}

export async function readCollection(fileName, fallback = []) {
  const filePath = await readablePath(fileName);
  try {
    const fileContents = await readFile(filePath, "utf8");
    return JSON.parse(fileContents);
  } catch {
    // File doesn't exist at all — return fallback
    return fallback;
  }
}

export async function writeCollection(fileName, records) {
  // Always write to /tmp — works on Vercel (read-only bundled filesystem)
  // and locally (where /tmp also exists on Windows as C:\tmp or process falls through)
  await ensureDir(writableDir);
  const filePath = path.join(writableDir, fileName);
  await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  return records;
}
