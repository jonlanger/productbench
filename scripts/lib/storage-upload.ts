/**
 * Supabase Storage uploads via REST (avoids supabase-js WebSocket requirement on Node 20).
 */

import { readFileSync } from "fs";
import { join } from "path";

import { PRODUCT_SCREENSHOTS_BUCKET } from "../../src/lib/product-screenshots";
import { hasStorageUploadConfig } from "./supabase-admin";

function storageApiKey(): string {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("Missing Supabase API key for Storage uploads.");
  }
  return key;
}

function contentTypeFor(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

export async function uploadStorageObject(
  objectPath: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }

  const key = storageApiKey();
  const url = `${supabaseUrl}/storage/v1/object/${PRODUCT_SCREENSHOTS_BUCKET}/${objectPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": contentType,
      "Cache-Control": "31536000",
      "x-upsert": "true",
    },
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Upload failed for ${objectPath} (${response.status}): ${detail.slice(0, 200)}`,
    );
  }
}

export async function uploadCaptureFiles(
  slug: string,
  dir: string,
  files: string[],
): Promise<number> {
  if (!hasStorageUploadConfig()) {
    throw new Error("Storage upload is not configured.");
  }

  let uploaded = 0;
  for (const file of files) {
    const objectPath = `${slug.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase()}/${file.replace(/^\/+/, "").replace(/\.\./g, "")}`;
    const body = readFileSync(join(dir, file));
    await uploadStorageObject(objectPath, body, contentTypeFor(file));
    uploaded += 1;
  }
  return uploaded;
}
