/**
 * Validate ProductBench capture coverage against the taxonomy layers
 * (surface / component / state / structure / source).
 *
 * Usage:
 *   npm run validate:ui -- --slug=notion
 *   npm run validate:ui -- --all [--limit=N]
 *   npm run validate:ui -- --slug=notion --json
 *   npm run validate:ui -- --slug=notion --from-db
 *
 * Reads public/products/<slug>/manifest.json + insights.json (default),
 * or Postgres when --from-db is set.
 * Writes public/products/<slug>/coverage.json (local mode only).
 */

import { config } from "dotenv";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ProductCaptureInsights, ProductScreenshot } from "../src/data/types";
import { products as productsTable } from "../src/db/schema";
import {
  formatCoverageReport,
  screenshotsToManifestShots,
  validateCaptureData,
  validateProductCapture,
  type CoverageReport,
} from "./lib/capture-coverage";

config({ path: ".env.local" });
config();

function argFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function argValue(name: string) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function listCapturedSlugs(): string[] {
  const root = join(process.cwd(), "public/products");
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) =>
      existsSync(join(root, slug, "manifest.json")) ||
      readdirSync(join(root, slug)).some((f) =>
        /\.(png|jpe?g|webp)$/i.test(f),
      ),
    )
    .sort();
}

function writeCoverage(report: CoverageReport, fromDb: boolean) {
  if (fromDb) return;
  const dir = join(process.cwd(), "public/products", report.slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "coverage.json"), JSON.stringify(report, null, 2));
}

async function validateFromDb(slug: string): Promise<CoverageReport> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL required for --from-db validation");
  }

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
    const shots = (row?.screenshots as ProductScreenshot[] | null) ?? [];
    const insights = (row?.captureInsights as ProductCaptureInsights | null) ?? null;
    return validateCaptureData(slug, screenshotsToManifestShots(shots), insights);
  } finally {
    await client.end();
  }
}

async function listDbCapturedSlugs(): Promise<string[]> {
  const url = process.env.DATABASE_URL;
  if (!url) return [];

  const client = postgres(url, { prepare: false, max: 1, ssl: "require" });
  const db = drizzle(client);

  try {
    const rows = await db
      .select({
        slug: productsTable.slug,
        screenshots: productsTable.screenshots,
      })
      .from(productsTable);

    return rows
      .filter((row) => {
        const shots = (row.screenshots as ProductScreenshot[] | null) ?? [];
        return shots.length > 0;
      })
      .map((row) => row.slug)
      .sort();
  } finally {
    await client.end();
  }
}

async function main() {
  const slug = argValue("slug");
  const runAll = argFlag("all");
  const asJson = argFlag("json");
  const fromDb = argFlag("from-db");
  const limit = Number(argValue("limit") ?? "0");

  if (!slug && !runAll) {
    console.error(
      [
        "Usage:",
        "  npm run validate:ui -- --slug=<product>",
        "  npm run validate:ui -- --all [--limit=N]",
        "  npm run validate:ui -- --slug=notion --json",
        "  npm run validate:ui -- --slug=notion --from-db",
      ].join("\n"),
    );
    process.exit(1);
  }

  let slugs = runAll
    ? fromDb
      ? await listDbCapturedSlugs()
      : listCapturedSlugs()
    : [slug!];
  if (limit > 0) slugs = slugs.slice(0, limit);

  if (slugs.length === 0) {
    console.error(
      fromDb
        ? "No captured products found in Postgres"
        : "No captured products found under public/products/",
    );
    process.exit(1);
  }

  const reports: CoverageReport[] = [];
  for (const s of slugs) {
    const report = fromDb ? await validateFromDb(s) : validateProductCapture(s);
    writeCoverage(report, fromDb);
    reports.push(report);
    if (!asJson) {
      console.log(formatCoverageReport(report));
      if (!fromDb) {
        console.log(`  wrote public/products/${s}/coverage.json`);
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
  } else if (reports.length > 1) {
    const passed = reports.filter((r) => r.pass).length;
    const failed = reports.length - passed;
    console.log(
      `\nDone: ${passed} pass · ${failed} fail · avg score ${Math.round(reports.reduce((a, r) => a + r.score, 0) / reports.length)}`,
    );
  }

  const anyFail = reports.some((r) => !r.pass);
  process.exit(anyFail ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
