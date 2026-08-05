/**
 * Upload local public/products/[slug] images → Vercel Blob (private) and
 * rewrite products.screenshots[].src to app proxy URLs (/api/blob/...).
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ProductScreenshot } from "../../src/data/types";
import { products as productsTable } from "../../src/db/schema";
import {
  contentTypeForFileName,
  hasBlobConfig,
  productScreenshotBlobUrl,
} from "../../src/lib/blob";
import {
  productScreenshotObjectPath,
  screenshotFileName,
} from "../../src/lib/product-screenshots";
import { uploadStorageObject } from "./storage-upload";

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;
const UPLOAD_RE = /\.(png|jpe?g|webp|gif|json)$/i;

export type SyncStorageResult = {
  slug: string;
  uploaded: number;
  skipped: boolean;
  reason?: string;
  rewritten: number;
};

export async function syncProductScreenshotsToStorage(
  slug: string,
  options: { skipDb?: boolean; dir?: string } = {},
): Promise<SyncStorageResult> {
  if (!hasBlobConfig()) {
    return {
      slug,
      uploaded: 0,
      skipped: true,
      reason: "BLOB_READ_WRITE_TOKEN not set — skipping Blob upload",
      rewritten: 0,
    };
  }

  const dir =
    options.dir ?? join(process.cwd(), "public/products", slug);
  if (!existsSync(dir)) {
    return {
      slug,
      uploaded: 0,
      skipped: true,
      reason: `No capture directory at ${dir}`,
      rewritten: 0,
    };
  }

  const files = readdirSync(dir).filter((f) => UPLOAD_RE.test(f));
  const images = files.filter((f) => IMAGE_RE.test(f));
  if (images.length === 0) {
    return {
      slug,
      uploaded: 0,
      skipped: true,
      reason: "No image files to upload",
      rewritten: 0,
    };
  }

  let uploaded = 0;

  for (const file of files) {
    const objectPath = productScreenshotObjectPath(slug, file);
    const body = readFileSync(join(dir, file));
    await uploadStorageObject(objectPath, body, contentTypeForFileName(file));
    uploaded += 1;
  }

  if (options.skipDb) {
    return { slug, uploaded, skipped: false, rewritten: 0 };
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return {
      slug,
      uploaded,
      skipped: false,
      reason: "DATABASE_URL not set — uploaded files but skipped DB rewrite",
      rewritten: 0,
    };
  }

  const client = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    ssl: "require",
  });
  const db = drizzle(client);

  try {
    const rows = await db
      .select({ screenshots: productsTable.screenshots })
      .from(productsTable)
      .where(eq(productsTable.slug, slug));

    const prior = (rows[0]?.screenshots as ProductScreenshot[] | null) ?? [];
    const byFile = new Map<string, string>();
    for (const file of images) {
      byFile.set(file, productScreenshotBlobUrl(slug, file));
    }

    const priorByFile = new Map<string, ProductScreenshot>();
    for (const shot of prior) {
      const file = screenshotFileName(shot.src);
      if (file) priorByFile.set(file, shot);
    }

    const rewrittenShots: ProductScreenshot[] = [];
    let rewritten = 0;

    for (const file of images) {
      const nextSrc = byFile.get(file)!;
      const existing = priorByFile.get(file);
      if (existing) {
        if (existing.src !== nextSrc) rewritten += 1;
        rewrittenShots.push({ ...existing, src: nextSrc });
        priorByFile.delete(file);
      } else {
        rewritten += 1;
        rewrittenShots.push({
          title: file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          src: nextSrc,
          kind: "supporting",
        });
      }
    }

    // Keep any prior shots that aren't local files we just uploaded
    // (e.g. curated remote HTTPS URLs from collect/enrich)
    for (const leftover of priorByFile.values()) {
      rewrittenShots.push(leftover);
    }

    await db
      .update(productsTable)
      .set({
        screenshots: rewrittenShots,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.slug, slug));

    return { slug, uploaded, skipped: false, rewritten };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      slug,
      uploaded,
      skipped: false,
      reason: `DB rewrite skipped (${message.slice(0, 100)})`,
      rewritten: 0,
    };
  } finally {
    await client.end({ timeout: 1 }).catch(() => undefined);
  }
}
