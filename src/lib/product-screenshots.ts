/**
 * Product catalog screenshots in Supabase Storage.
 * Playwright capture uses a temp workspace when Storage is configured;
 * `public/products/[slug]/` is only used with `--local`.
 */

export const PRODUCT_SCREENSHOTS_BUCKET = "product-screenshots";

/** Object key inside the bucket: `{slug}/{filename}` */
export function productScreenshotObjectPath(slug: string, fileName: string): string {
  const safeSlug = slug.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
  const safeFile = fileName.replace(/^\/+/, "").replace(/\.\./g, "");
  return `${safeSlug}/${safeFile}`;
}

export function productScreenshotPublicUrl(
  supabaseUrl: string,
  slug: string,
  fileName: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const path = productScreenshotObjectPath(slug, fileName);
  return `${base}/storage/v1/object/public/${PRODUCT_SCREENSHOTS_BUCKET}/${path}`;
}

export function isSupabaseStorageUrl(src: string): boolean {
  return /\/storage\/v1\/object\/public\//.test(src);
}

/** Filename from a local `/products/slug/file` or Storage public URL. */
export function screenshotFileName(src: string): string | null {
  try {
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
