/**
 * Vercel Blob (private) helpers for product screenshots, avatars, and submissions.
 * Binaries are private; the app serves them through `/api/blob/[...pathname]`.
 */

export const BLOB_ACCESS = "private" as const;

export function hasBlobConfig(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function productBlobPathname(slug: string, fileName: string): string {
  const safeSlug = slug.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
  const safeFile = fileName.replace(/^\/+/, "").replace(/\.\./g, "");
  return `products/${safeSlug}/${safeFile}`;
}

export function avatarBlobPathname(userId: string, fileName: string): string {
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext === "jpeg"
      ? "jpg"
      : ext
    : "jpg";
  return `avatars/${userId}/avatar.${safeExt}`;
}

export function submissionBlobPathname(
  userId: string,
  productSlug: string,
  fileName: string,
): string {
  const safeSlug = productSlug.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
  const safeFile = fileName.replace(/^\/+/, "").replace(/\.\./g, "");
  return `submissions/${userId}/${safeSlug}/${safeFile}`;
}

/** App-relative URL that proxies a private blob for next/image and <img>. */
export function blobMediaUrl(pathname: string): string {
  const clean = pathname.replace(/^\/+/, "");
  return `/api/blob/${clean}`;
}

export function productScreenshotBlobUrl(slug: string, fileName: string): string {
  return blobMediaUrl(productBlobPathname(slug, fileName));
}

export function isBlobMediaUrl(src: string): boolean {
  return src.startsWith("/api/blob/") || src.includes("/api/blob/");
}

export function isPrivateBlobUrl(src: string): boolean {
  return /\.private\.blob\.vercel-storage\.com\//.test(src);
}

/** Pathname from `/api/blob/...` or a private blob URL. */
export function blobPathnameFromSrc(src: string): string | null {
  try {
    if (src.startsWith("/api/blob/")) {
      return decodeURIComponent(src.slice("/api/blob/".length).split("?")[0]!);
    }
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const url = new URL(src);
      if (url.pathname.startsWith("/api/blob/")) {
        return decodeURIComponent(
          url.pathname.slice("/api/blob/".length).replace(/^\//, ""),
        );
      }
      if (isPrivateBlobUrl(src)) {
        return decodeURIComponent(url.pathname.replace(/^\//, ""));
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function contentTypeForFileName(fileName: string): string {
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
