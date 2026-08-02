/**
 * Upload capture binaries to Vercel Blob (private).
 */

import { readFileSync } from "fs";
import { join } from "path";
import { put } from "@vercel/blob";

import {
  BLOB_ACCESS,
  contentTypeForFileName,
  hasBlobConfig,
  productBlobPathname,
} from "../../src/lib/blob";

export async function uploadStorageObject(
  objectPath: string,
  body: Buffer,
  contentType: string,
): Promise<{ url: string; pathname: string }> {
  if (!hasBlobConfig()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
  }

  const blob = await put(objectPath, body, {
    access: BLOB_ACCESS,
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 31536000,
  });

  return { url: blob.url, pathname: blob.pathname };
}

export async function uploadCaptureFiles(
  slug: string,
  dir: string,
  files: string[],
): Promise<number> {
  if (!hasBlobConfig()) {
    throw new Error("Blob upload is not configured (BLOB_READ_WRITE_TOKEN).");
  }

  let uploaded = 0;
  for (const file of files) {
    const objectPath = productBlobPathname(slug, file);
    const body = readFileSync(join(dir, file));
    await uploadStorageObject(objectPath, body, contentTypeForFileName(file));
    uploaded += 1;
  }
  return uploaded;
}
