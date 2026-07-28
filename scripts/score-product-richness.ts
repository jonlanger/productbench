/**
 * Score product content richness from local capture artifacts + seed fields.
 *
 *   npx tsx scripts/score-product-richness.ts
 *   npx tsx scripts/score-product-richness.ts --json
 */
import fs from "fs";
import path from "path";
import { products } from "../src/data/products";

type Row = {
  slug: string;
  name: string;
  shots: number;
  pages: number;
  features: number;
  patterns: number;
  fallbackShots: number;
  hasInsights: boolean;
  score: number;
  band: "empty" | "thin" | "moderate" | "rich" | "packed";
};

function bandFor(score: number, shots: number): Row["band"] {
  if (shots === 0 && score < 20) return "empty";
  if (shots < 14 || score < 50) return "thin";
  if (shots < 28 || score < 100) return "moderate";
  if (shots < 40 || score < 140) return "rich";
  return "packed";
}

function scoreProduct(slug: string, name: string, seedFeatures: number, seedPatterns: number): Row {
  const dir = path.join("public/products", slug);
  let shots = 0;
  let pages = 0;
  let features = seedFeatures;
  let patterns = seedPatterns;
  let fallbackShots = 0;
  let hasInsights = false;

  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    const fileShots = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).length;
    shots = fileShots;
    const manPath = path.join(dir, "manifest.json");
    if (fs.existsSync(manPath)) {
      try {
        const m = JSON.parse(fs.readFileSync(manPath, "utf8")) as {
          screenshots?: Array<{ file?: string; playbookStep?: string }>;
          shots?: Array<{ file?: string; playbookStep?: string }>;
        };
        const arr = m.screenshots ?? m.shots ?? [];
        // Prefer the larger of manifest vs on-disk (guards thin-overwrite manifests)
        shots = Math.max(arr.length, fileShots);
        fallbackShots = arr.filter(
          (s) =>
            String(s.file ?? "").includes("fallback") ||
            String(s.playbookStep ?? "").includes("fallback"),
        ).length;
        if (fallbackShots === 0) {
          fallbackShots = files.filter((f) => f.includes("fallback")).length;
        }
      } catch {
        /* ignore */
      }
    }
    const insightsPath = path.join(dir, "insights.json");
    if (fs.existsSync(insightsPath)) {
      hasInsights = true;
      try {
        const i = JSON.parse(fs.readFileSync(insightsPath, "utf8")) as {
          pageCount?: number;
          pages?: unknown[];
          featureCandidates?: unknown[];
          patternCandidates?: unknown[];
        };
        pages = i.pageCount ?? i.pages?.length ?? 0;
        features = Math.max(features, i.featureCandidates?.length ?? 0);
        patterns = Math.max(patterns, i.patternCandidates?.length ?? 0);
      } catch {
        /* ignore */
      }
    }
  }

  const score =
    shots * 2 +
    pages * 3 +
    Math.min(features, 20) +
    Math.min(patterns, 15) +
    Math.min(fallbackShots, 12) +
    (hasInsights ? 8 : 0);

  return {
    slug,
    name,
    shots,
    pages,
    features,
    patterns,
    fallbackShots,
    hasInsights,
    score,
    band: bandFor(score, shots),
  };
}

function main() {
  const asJson = process.argv.includes("--json");
  const rows = products
    .map((p) =>
      scoreProduct(
        p.slug,
        p.name,
        p.features?.length ?? 0,
        p.ux?.patterns?.length ?? 0,
      ),
    )
    .sort((a, b) => a.score - b.score);

  const bands = {
    empty: rows.filter((r) => r.band === "empty").length,
    thin: rows.filter((r) => r.band === "thin").length,
    moderate: rows.filter((r) => r.band === "moderate").length,
    rich: rows.filter((r) => r.band === "rich").length,
    packed: rows.filter((r) => r.band === "packed").length,
  };

  if (asJson) {
    console.log(JSON.stringify({ bands, rows }, null, 2));
    return;
  }

  console.log(`Catalog richness (${rows.length} products)\n`);
  console.log(
    `Bands: empty=${bands.empty} thin=${bands.thin} moderate=${bands.moderate} rich=${bands.rich} packed=${bands.packed}`,
  );
  console.log("\nLEAST RICH (bottom 20):");
  for (const r of rows.slice(0, 20)) {
    console.log(
      `  ${String(r.score).padStart(3)}  shots=${String(r.shots).padStart(2)} pages=${String(r.pages).padStart(2)} fb=${String(r.fallbackShots).padStart(2)}  ${r.slug}`,
    );
  }
  console.log("\nRICHEST (top 20):");
  for (const r of [...rows].reverse().slice(0, 20)) {
    console.log(
      `  ${String(r.score).padStart(3)}  shots=${String(r.shots).padStart(2)} pages=${String(r.pages).padStart(2)} fb=${String(r.fallbackShots).padStart(2)}  ${r.slug}`,
    );
  }
}

main();
