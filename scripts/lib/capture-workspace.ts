/**
 * Capture workspace: temp dir for remote-only runs, public/products for --local.
 */

import { existsSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { list } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ProductCaptureInsights, ProductScreenshot } from "../../src/data/types";
import { products as productsTable } from "../../src/db/schema";
import { hasBlobConfig } from "../../src/lib/blob";
import { screenshotFileName } from "../../src/lib/product-screenshots";
import { hasStorageUploadConfig } from "./supabase-admin";

export type CaptureShotRecord = {
  file: string;
  title: string;
  caption: string;
  kind: string;
  sourceUrl: string;
  capturedAt: string;
  playbookStep: string;
  viewport?: { width: number; height: number };
  scrollY?: number;
  pageTitle?: string;
  width?: number;
  height?: number;
  phash?: string;
  unique?: boolean;
};

export function useRemoteCapture(argv: string[] = process.argv): boolean {
  if (argv.includes("--local")) return false;
  if (argv.includes("--skip-storage")) return false;
  return hasStorageUploadConfig();
}

export function captureWorkspaceDir(
  slug: string,
  remote: boolean,
): string {
  if (remote) {
    return join(tmpdir(), "productbench-capture", slug);
  }
  return join(process.cwd(), "public/products", slug);
}

export function ensureCaptureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function cleanupCaptureDir(dir: string, remote: boolean): void {
  if (!remote || !existsSync(dir)) return;
  rmSync(dir, { recursive: true, force: true });
}

export function productHasLocalCapture(slug: string): boolean {
  return existsSync(
    join(process.cwd(), "public/products", slug, "manifest.json"),
  );
}

function screenshotToCaptureShot(shot: ProductScreenshot): CaptureShotRecord | null {
  const file = screenshotFileName(shot.src);
  if (!file) return null;
  return {
    file,
    title: shot.title,
    caption: shot.caption ?? "",
    kind: shot.kind ?? "supporting",
    sourceUrl: shot.sourceUrl ?? "",
    capturedAt: shot.capturedAt ?? "",
    playbookStep: shot.playbookStep ?? "",
    viewport: shot.viewport,
    scrollY: shot.scrollY,
    pageTitle: shot.pageTitle,
    width: shot.width,
    height: shot.height,
    phash: shot.phash,
    unique: shot.unique,
  };
}

export async function loadPriorCaptureFromDb(slug: string): Promise<{
  shots: CaptureShotRecord[];
  insights: ProductCaptureInsights | null;
}> {
  const url = process.env.DATABASE_URL;
  if (!url) return { shots: [], insights: null };

  const client = postgres(url, { prepare: false, max: 1, ssl: "require" });
  const db = drizzle(client);

  try {
    const rows = await db
      .select({
        screenshots: productsTable.screenshots,
        captureInsights: productsTable.captureInsights,
      })
      .from(productsTable)
      .where(eq(productsTable.slug, slug));

    const row = rows[0];
    if (!row) return { shots: [], insights: null };

    const prior = (row.screenshots as ProductScreenshot[] | null) ?? [];
    const shots = prior
      .map(screenshotToCaptureShot)
      .filter((s): s is CaptureShotRecord => s != null);

    return { shots, insights: row.captureInsights ?? null };
  } catch {
    return { shots: [], insights: null };
  } finally {
    await client.end({ timeout: 1 }).catch(() => undefined);
  }
}

export async function loadCapturedSlugsFromDb(): Promise<Set<string>> {
  const url = process.env.DATABASE_URL;
  if (!url) return new Set();

  const client = postgres(url, { prepare: false, max: 1, ssl: "require" });
  const db = drizzle(client);

  try {
    const rows = await db
      .select({
        slug: productsTable.slug,
        screenshots: productsTable.screenshots,
      })
      .from(productsTable);

    return new Set(
      rows
        .filter((row) => {
          const shots = (row.screenshots as ProductScreenshot[] | null) ?? [];
          return shots.length > 0;
        })
        .map((row) => row.slug),
    );
  } catch {
    return new Set();
  } finally {
    await client.end({ timeout: 1 }).catch(() => undefined);
  }
}

/** Slugs that already have objects under products/[slug]/ in private Vercel Blob. */
export async function loadCapturedSlugsFromBlob(): Promise<Set<string>> {
  if (!hasBlobConfig()) return new Set();

  const slugs = new Set<string>();
  let cursor: string | undefined;

  do {
    const page = await list({
      prefix: "products/",
      cursor,
      limit: 1000,
    });
    for (const blob of page.blobs) {
      const parts = blob.pathname.replace(/^\/+/, "").split("/");
      if (parts[0] === "products" && parts[1]) slugs.add(parts[1]!);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return slugs;
}

/** Prefer Vercel Blob inventory; Postgres is optional metadata only. */
export async function loadCapturedSlugs(): Promise<Set<string>> {
  if (hasBlobConfig()) {
    const fromBlob = await loadCapturedSlugsFromBlob();
    if (fromBlob.size > 0) return fromBlob;
  }

  if (process.env.DATABASE_URL) {
    return loadCapturedSlugsFromDb();
  }

  return new Set();
}
