/**
 * Blob / storage config for capture sync scripts.
 * Supabase Auth remains separate — file binaries use Vercel Blob.
 */

import { hasBlobConfig } from "../../src/lib/blob";

/** True when Vercel Blob is configured for capture uploads. */
export function hasStorageUploadConfig() {
  return hasBlobConfig();
}
