import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

config({ path: ".env.local", quiet: true });

export const ROOT = process.cwd();
export const RECORDINGS = path.join(ROOT, "data", "recordings");
export const CACHE = path.join(ROOT, "data", "cache");

/** "CALL 007.mp3" -> "CALL-007" */
export function callIdFromFile(file: string) {
  return path.basename(file, path.extname(file)).trim().replace(/\s+/g, "-").toUpperCase();
}

export function recordings(filter?: string[]) {
  const files = fs
    .readdirSync(RECORDINGS)
    .filter((f) => /\.(mp3|wav|m4a|ogg|webm)$/i.test(f))
    .sort();
  if (!filter?.length) return files;
