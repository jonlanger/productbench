/**
 * When Postgres is unavailable, seed products have empty `screenshots` arrays
 * even though capture binaries + manifests live in Vercel Blob (and sometimes
 * under public/products for --local runs). Rebuild gallery metadata from those.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { get, list } from "@vercel/blob";

import type { Product, ProductScreenshot } from "@/data/types";

import {
  BLOB_ACCESS,
  hasBlobConfig,
  productBlobPathname,
  productScreenshotBlobUrl,
} from "./blob";
import { localProductScreenshotSrc } from "./product-screenshots";

type ManifestShot = {
  file?: string;
  title?: string;
  caption?: string;
  kind?: ProductScreenshot["kind"];
  sourceUrl?: string;
  capturedAt?: string;
  viewport?: { width: number; height: number };
  scrollY?: number;
  pageTitle?: string;
  width?: number;
  height?: number;
  phash?: string;
  playbookStep?: string;
  unique?: boolean;
  element?: ProductScreenshot["element"];
};

type CaptureManifest = {
  shots?: ManifestShot[];
};

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;

function shotsFromManifest(
  slug: string,
  manifest: CaptureManifest,
  srcForFile: (file: string) => string,
): ProductScreenshot[] {
  const shots = manifest.shots ?? [];
  const out: ProductScreenshot[] = [];

  for (const shot of shots) {
    const file = shot.file?.replace(/^\/+/, "");
    if (!file || !IMAGE_RE.test(file)) continue;
    out.push({
      title: shot.title || file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      src: srcForFile(file),
      caption: shot.caption,
      kind: shot.kind,
      sourceUrl: shot.sourceUrl,
      capturedAt: shot.capturedAt,
      viewport: shot.viewport,
      scrollY: shot.scrollY,
      pageTitle: shot.pageTitle,
      width: shot.width ?? shot.viewport?.width,
      height: shot.height ?? shot.viewport?.height,
      phash: shot.phash,
      playbookStep: shot.playbookStep,
      unique: shot.unique,
      element: shot.element,
    });
  }

  return out;
}

async function loadBlobManifest(slug: string): Promise<CaptureManifest | null> {
  if (!hasBlobConfig()) return null;

  try {
    const result = await get(productBlobPathname(slug, "manifest.json"), {
      access: BLOB_ACCESS,
    });
    if (!result?.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as CaptureManifest;
  } catch {
    return null;
  }
}

function loadLocalManifest(slug: string): CaptureManifest | null {
  const path = join(process.cwd(), "public/products", slug, "manifest.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as CaptureManifest;
  } catch {
    return null;
  }
}

/** Last resort: list image blobs under products/{slug}/ (no titles/kinds). */
async function listBlobScreenshots(slug: string): Promise<ProductScreenshot[]> {
  if (!hasBlobConfig()) return [];

  const prefix = `products/${slug}/`;
  const out: ProductScreenshot[] = [];
  let cursor: string | undefined;

  try {
    do {
      const page = await list({
        prefix,
        limit: 200,
        cursor,
      });
      for (const blob of page.blobs) {
        const file = blob.pathname.slice(prefix.length);
        if (!file || file.includes("/") || !IMAGE_RE.test(file)) continue;
        out.push({
          title: file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          src: productScreenshotBlobUrl(slug, file),
          kind: "supporting",
        });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } catch {
    return out;
  }

  return out;
}

/**
 * Fill empty `product.screenshots` from Blob/local capture manifests.
 * No-op when screenshots are already present.
 */
export async function hydrateProductScreenshots(
  product: Product,
): Promise<Product> {
  if ((product.screenshots?.length ?? 0) > 0) return product;

  const blobManifest = await loadBlobManifest(product.slug);
  if (blobManifest?.shots?.length) {
    const screenshots = shotsFromManifest(
      product.slug,
      blobManifest,
      (file) => productScreenshotBlobUrl(product.slug, file),
    );
    if (screenshots.length > 0) {
      return withHydratedScreenshots(product, screenshots);
    }
  }

  const localManifest = loadLocalManifest(product.slug);
  if (localManifest?.shots?.length) {
    const screenshots = shotsFromManifest(
      product.slug,
      localManifest,
      (file) => localProductScreenshotSrc(product.slug, file),
    );
    if (screenshots.length > 0) {
      return withHydratedScreenshots(product, screenshots);
    }
  }

  const listed = await listBlobScreenshots(product.slug);
  if (listed.length > 0) {
    return withHydratedScreenshots(product, listed);
  }

  return product;
}

function withHydratedScreenshots(
  product: Product,
  screenshots: ProductScreenshot[],
): Product {
  const screenCount = Math.max(
    product.metrics?.screenCount ?? 0,
    screenshots.length,
  );
  return {
    ...product,
    screenshots,
    metrics: {
      ...product.metrics,
      screenCount,
    },
    captureInsights: product.captureInsights
      ? {
          ...product.captureInsights,
          screenshotCount: Math.max(
            product.captureInsights.screenshotCount ?? 0,
            screenshots.length,
          ),
        }
      : product.captureInsights,
  };
}
