/**
 * Product catalog screenshots in Vercel Blob (private).
 * Playwright capture uses a temp workspace when Blob is configured;
 * `public/products/[slug]/` is only used with `--local`.
 */

import {
  blobPathnameFromSrc,
  productBlobPathname,
  productScreenshotBlobUrl,
} from "./blob";

/** @deprecated Path prefix only — storage is Vercel Blob, not a Supabase bucket. */
export const PRODUCT_SCREENSHOTS_BUCKET = "products";

/** Object key / blob pathname: `products/{slug}/{filename}` */
export function productScreenshotObjectPath(slug: string, fileName: string): string {
  return productBlobPathname(slug, fileName);
}

/** App proxy URL for a private product screenshot blob. */
export function productScreenshotPublicUrl(slug: string, fileName: string): string {
  return productScreenshotBlobUrl(slug, fileName);
}

export function isSupabaseStorageUrl(src: string): boolean {
  return /\/storage\/v1\/object\/public\//.test(src);
}

/** Filename from a local `/products/slug/file`, Blob proxy, or Storage URL. */
export function screenshotFileName(src: string): string | null {
  try {
    const fromBlob = blobPathnameFromSrc(src);
    if (fromBlob) {
      const parts = fromBlob.split("/").filter(Boolean);
      return parts.at(-1) ?? null;
    }
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const pathname = new URL(src).pathname;
      const parts = pathname.split("/").filter(Boolean);
      return parts.at(-1) ?? null;
    }
    const parts = src.split("/").filter(Boolean);
    return parts.at(-1) ?? null;
  } catch {
    return null;
  }
}

export function localProductScreenshotSrc(slug: string, fileName: string): string {
  return `/products/${slug}/${fileName}`;
}
