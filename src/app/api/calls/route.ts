import { after } from "next/server";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { createCall, enqueue, mimeFor } from "@/lib/pipeline";
import { blobEnabled } from "@/lib/storage";

export const maxDuration = 300;

function isBlobUrl(url: string) {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

const MAX_BYTES = 60 * 1024 * 1024;
const AUDIO_EXT = /\.(mp3|wav|m4a|mp4|ogg|webm|flac)$/i;

/**
 * Add calls for processing.
 * - multipart/form-data with one or more `files` (local/dev, small files), or
 * - JSON { uploads: [{ url, filename }] } for recordings already uploaded to Blob storage
 *   (production: the browser uploads straight to Blob, bypassing the 4.5 MB function body limit).
 */
