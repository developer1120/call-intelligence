import fs from "node:fs/promises";
import path from "node:path";

/**
 * Audio storage. Recordings contain customer details, so they are never public:
 * private Vercel Blob in production, ./data/uploads locally.
 * The browser always plays them through /api/calls/[id]/audio.
 */
const LOCAL_DIR = path.join(process.cwd(), "data", "uploads");
/**
 * Blob is configured either with a read-write token (older stores) or, for stores created
 * through the Vercel dashboard today, with BLOB_STORE_ID + the platform's automatic OIDC token.
 */
export function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}


export async function saveAudio(key: string, data: Buffer, mime: string): Promise<string> {
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
