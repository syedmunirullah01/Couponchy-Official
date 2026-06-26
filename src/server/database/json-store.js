import "server-only";

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const databaseDirectory = path.join(process.cwd(), "data", "database");

async function ensureDatabaseDirectory() {
  await mkdir(databaseDirectory, { recursive: true });
}

async function ensureCollectionFile(fileName, fallback = []) {
  await ensureDatabaseDirectory();

  const filePath = path.join(databaseDirectory, fileName);
  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, `${JSON.stringify(fallback, null, 2)}\n`, "utf8");
  }
  return filePath;
}

export async function readCollection(fileName, fallback = []) {
  const filePath = await ensureCollectionFile(fileName, fallback);
  const fileContents = await readFile(filePath, "utf8");

  return JSON.parse(fileContents);
}

export async function writeCollection(fileName, records) {
  const filePath = await ensureCollectionFile(fileName, Array.isArray(records) ? [] : {});
  await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  return records;
}
