/**
 * Validate ProductBench capture coverage against the taxonomy layers
 * (surface / component / state / structure / source).
 *
 * Usage:
 *   npm run validate:ui -- --slug=notion
 *   npm run validate:ui -- --all [--limit=N]
 *   npm run validate:ui -- --slug=notion --json
 *
 * Reads public/products/<slug>/manifest.json + insights.json.
 * Writes public/products/<slug>/coverage.json.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

import {
  formatCoverageReport,
  validateProductCapture,
  type CoverageReport,
} from "./lib/capture-coverage";

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

function writeCoverage(report: CoverageReport) {
  const dir = join(process.cwd(), "public/products", report.slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "coverage.json"), JSON.stringify(report, null, 2));
}

function main() {
  const slug = argValue("slug");
  const runAll = argFlag("all");
  const asJson = argFlag("json");
  const limit = Number(argValue("limit") ?? 0);

  if (!slug && !runAll) {
    console.error(
      [
        "Usage:",
        "  npm run validate:ui -- --slug=<product>",
        "  npm run validate:ui -- --all [--limit=N]",
        "  npm run validate:ui -- --slug=notion --json",
      ].join("\n"),
    );
    process.exit(1);
  }

  let slugs = runAll ? listCapturedSlugs() : [slug!];
  if (limit > 0) slugs = slugs.slice(0, limit);

  if (slugs.length === 0) {
    console.error("No captured products found under public/products/");
    process.exit(1);
  }

  const reports: CoverageReport[] = [];
  for (const s of slugs) {
    const report = validateProductCapture(s);
    writeCoverage(report);
    reports.push(report);
    if (!asJson) {
      console.log(formatCoverageReport(report));
      console.log(`  wrote public/products/${s}/coverage.json`);
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

main();
