/**
 * Upload local public/products/[slug] images → Supabase Storage and
 * rewrite products.screenshots[].src to public Storage URLs.
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ProductScreenshot } from "../../src/data/types";
import { products as productsTable } from "../../src/db/schema";
import {
  PRODUCT_SCREENSHOTS_BUCKET,
  productScreenshotObjectPath,
  productScreenshotPublicUrl,
  screenshotFileName,
} from "../../src/lib/product-screenshots";
import { hasStorageUploadConfig } from "./supabase-admin";
import { uploadStorageObject } from "./storage-upload";

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;

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
  if (!hasStorageUploadConfig()) {
    return {
      slug,
      uploaded: 0,
      skipped: true,
      reason:
        "NEXT_PUBLIC_SUPABASE_URL / Supabase API key not set — skipping Storage upload",
      rewritten: 0,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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

  const files = readdirSync(dir).filter((f) => IMAGE_RE.test(f));
  if (files.length === 0) {
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
    await uploadStorageObject(objectPath, body, contentTypeFor(file));
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
    for (const file of files) {
      byFile.set(
        file,
        productScreenshotPublicUrl(supabaseUrl, slug, file),
      );
    }

    const priorByFile = new Map<string, ProductScreenshot>();
    for (const shot of prior) {
      const file = screenshotFileName(shot.src);
      if (file) priorByFile.set(file, shot);
    }

    const rewrittenShots: ProductScreenshot[] = [];
    let rewritten = 0;

    for (const file of files) {
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
  } finally {
    await client.end();
  }
}
