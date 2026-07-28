/**
 * Capture coverage validation against the ProductBench taxonomy
 * (surface / component / state / structure / source).
 *
 * Shared by `validate-capture.ts` and post-capture checks in `capture-product-ui.ts`.
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

import {
  CAPTURE_TARGETS,
  type CaptureLayer,
} from "../../src/data/capture-process";
import type {
  ProductCaptureInsights,
  ProductScreenshot,
  ProductScreenshotKind,
} from "../../src/data/types";
import { screenshotFileName } from "../../src/lib/product-screenshots";
import { hammingDistance } from "./image-dedupe";

/** Overall thin coverage: fewer than this many unique shots. */
export const THIN_UNIQUE_TOTAL = 20;

/**
 * Per-layer unique minimums. Structure can be satisfied by insights landmarks;
 * source is optional (only required when open-source signals exist).
 */
export const LAYER_MIN_UNIQUE: Record<CaptureLayer, number> = {
  surface: 8,
  component: 3,
  state: 1,
  structure: 1,
  source: 0,
};

/** Hamming distance at or below this → near-duplicate. */
export const NEAR_DUPLICATE_HAMMING = 10;

export type ManifestShot = {
  file: string;
  title: string;
  caption?: string;
  kind?: ProductScreenshotKind | string;
  sourceUrl?: string;
  playbookStep?: string;
  viewport?: { width: number; height: number };
  phash?: string;
  unique?: boolean;
  width?: number;
  height?: number;
};

export type CoverageIssue = {
  code:
    | "thin-total"
    | "thin-layer"
    | "placeholder-label"
    | "near-duplicate"
    | "missing-artifacts";
  severity: "error" | "warn";
  message: string;
  layer?: CaptureLayer;
  shots?: string[];
};

export type LayerCoverage = {
  layer: CaptureLayer;
  title: string;
  targets: string[];
  shotCount: number;
  uniqueCount: number;
  thin: boolean;
  minUnique: number;
  /** How this layer was satisfied (screenshots and/or insights). */
  evidence: string[];
  sampleTitles: string[];
};

export type CoverageReport = {
  slug: string;
  checkedAt: string;
  totalShots: number;
  uniqueShots: number;
  nearDuplicateCount: number;
  placeholderCount: number;
  thinTotal: boolean;
  layers: LayerCoverage[];
  thinLayers: CaptureLayer[];
  issues: CoverageIssue[];
  /** 0–100 completeness score */
  score: number;
  /** pass = unique≥20, required layers ok, no error-severity issues */
  pass: boolean;
  summary: string;
};

const LAYER_TITLES: Record<CaptureLayer, string> = {
  surface: "Surfaces",
  component: "Components",
  state: "States",
  structure: "Structure",
  source: "Source",
};

const PLACEHOLDER_LABEL =
  /^(?:supporting\s+)?(?:surface|screen|shot|band|nav|card|fallback)[\s_-]*\d+(?:[\s_-]*(?:mid|top|lower|band))?$/i;

const PLACEHOLDER_FILE =
  /^(?:surface|screen|shot|nav|card|fallback)[-_]?\d+(?:[-_](?:mid|top|lower|band(?:-\d+)?))?$/i;

const PLACEHOLDER_STEP =
  /^(?:surface|screen|nav|card)-\d+$|^(?:web-)?fallback/i;

export function isPlaceholderLabel(shot: {
  title?: string;
  file?: string;
  playbookStep?: string;
}): boolean {
  const title = (shot.title ?? "").replace(/\s*\(\d+\)\s*$/, "").trim();

  // Prefer human titles — numbered depth suffixes like "Homepage depth (2)" are fine
  if (titleHasHumanLabel(title)) return false;

  if (!title) {
    const stem = (shot.file ?? "").replace(/\.[^.]+$/, "");
    if (stem && PLACEHOLDER_FILE.test(stem)) return true;
    const step = shot.playbookStep ?? "";
    if (step && PLACEHOLDER_STEP.test(step)) return true;
    return true;
  }

  if (PLACEHOLDER_LABEL.test(title)) return true;
  if (/^supporting surface\s+\d+$/i.test(title)) return true;
  if (/^(?:ui\s+)?(?:detail|capture|screenshot)\s*\d*$/i.test(title)) return true;
  if (/^(?:surface|screen|shot|nav|card|fallback)[\s_-]*\d+/i.test(title)) {
    return true;
  }

  // Generic numbered-only leftovers after stripping depth suffix
  if (/^(?:surface|screen|shot|band|nav|card)\s*$/i.test(title)) return true;

  return false;
}

function titleHasHumanLabel(title: string) {
  if (!title) return false;
  if (PLACEHOLDER_LABEL.test(title)) return false;
  if (/^supporting surface\s+\d+$/i.test(title)) return false;
  if (/^(?:surface|screen|shot|nav|card|fallback)[\s_-]*\d+/i.test(title)) {
    return false;
  }
  // Real labels mention a product surface or pattern (not just "surface 3")
  return (
    title.length >= 6 &&
    /[a-z]/i.test(title) &&
    !/^(?:surface|screen|shot|band|nav|card|fallback)\b/i.test(title)
  );
}

export function assignLayer(shot: ManifestShot): CaptureLayer {
  const text = [
    shot.title,
    shot.caption,
    shot.playbookStep,
    shot.kind,
    shot.file,
    shot.sourceUrl,
  ]
    .filter(Boolean)
    .join(" · ")
    .toLowerCase();

  // Source first — rare and explicit
  if (
    /\b(github|gitlab|storybook|open[\s-]?source|design[\s-]?token|source\s+code)\b/.test(
      text,
    ) ||
    /github\.com|storybook/.test(shot.sourceUrl ?? "")
  ) {
    return "source";
  }

  // Structure — a11y / DOM captures
  if (
    /\b(a11y|accessibility|landmark|dom[\s-]?tree|heading\s+outline|axe)\b/.test(
      text,
    )
  ) {
    return "structure";
  }

  // State — responsive, empty, error, loading
  const isMobile =
    (shot.viewport?.width != null && shot.viewport.width <= 500) ||
    /\b(mobile|responsive|breakpoint|iphone|android)\b/.test(text);
  if (
    isMobile ||
    /\b(empty[\s-]?state|skeleton|loading|error\s+state|404|permission\s+denied|toast)\b/.test(
      text,
    )
  ) {
    return "state";
  }

  // Component — crops, dialogs, menus, forms
  if (
    shot.kind === "component" ||
    /\b(card|modal|dialog|sheet|menu|composer|picker|form|filter|dropdown|palette)\b/.test(
      text,
    ) ||
    /^card[-_]?\d+/i.test(shot.file ?? "")
  ) {
    return "component";
  }

  return "surface";
}

function targetsForLayer(layer: CaptureLayer) {
  return CAPTURE_TARGETS.filter((t) => t.layer === layer).map((t) => t.title);
}

function loadManifestShots(dir: string): ManifestShot[] {
  const manPath = join(dir, "manifest.json");
  if (existsSync(manPath)) {
    try {
      const raw = JSON.parse(readFileSync(manPath, "utf8")) as {
        shots?: ManifestShot[];
        screenshots?: ManifestShot[];
      };
      const arr = raw.shots ?? raw.screenshots ?? [];
      if (arr.length) return arr.filter((s) => s?.file || s?.title);
    } catch {
      /* fall through */
    }
  }

  // Disk-only fallback
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .map((file) => ({
      file,
      title: file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
    }));
}

function loadInsights(dir: string): ProductCaptureInsights | null {
  const path = join(dir, "insights.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ProductCaptureInsights;
  } catch {
    return null;
  }
}

function countNearDuplicates(shots: ManifestShot[]): {
  count: number;
  pairs: Array<[string, string]>;
} {
  const withHash = shots.filter((s) => s.phash);
  const pairs: Array<[string, string]> = [];
  const flagged = new Set<string>();

  for (let i = 0; i < withHash.length; i++) {
    for (let j = i + 1; j < withHash.length; j++) {
      const a = withHash[i]!;
      const b = withHash[j]!;
      if (hammingDistance(a.phash!, b.phash!) <= NEAR_DUPLICATE_HAMMING) {
        flagged.add(b.file);
        if (pairs.length < 12) pairs.push([a.file, b.file]);
      }
    }
  }

  // unique:false from capture, or missing unique flag but near-dup via hash
  const markedNotUnique = shots.filter((s) => s.unique === false).length;
  return {
    count: Math.max(flagged.size, markedNotUnique),
    pairs,
  };
}

function computeUniqueCount(
  shots: ManifestShot[],
  nearDuplicateCount: number,
): number {
  const markedUnique = shots.filter((s) => s.unique === true).length;
  if (markedUnique > 0) {
    // Prefer capture-time uniqueness, but don't exceed total − near-dups found
    return Math.min(markedUnique, shots.length - nearDuplicateCount);
  }
  return Math.max(0, shots.length - nearDuplicateCount);
}

function scoreReport(input: {
  uniqueShots: number;
  thinLayers: CaptureLayer[];
  requiredThin: CaptureLayer[];
  placeholderRate: number;
  nearDupRate: number;
  hasInsights: boolean;
}): number {
  const uniquePts = Math.min(40, (input.uniqueShots / THIN_UNIQUE_TOTAL) * 40);
  const required = ["surface", "component", "state", "structure"] as const;
  const layerPts =
    (required.filter((l) => !input.requiredThin.includes(l)).length /
      required.length) *
    40;
  const labelPts = Math.max(0, 10 * (1 - Math.min(1, input.placeholderRate)));
  const dupPts = Math.max(0, 10 * (1 - Math.min(1, input.nearDupRate * 2)));
  const insightBonus = input.hasInsights ? 0 : -5;
  return Math.round(
    Math.max(0, Math.min(100, uniquePts + layerPts + labelPts + dupPts + insightBonus)),
  );
}

export function validateCaptureData(
  slug: string,
  shots: ManifestShot[],
  insights: ProductCaptureInsights | null,
): CoverageReport {
  const issues: CoverageIssue[] = [];
  const checkedAt = new Date().toISOString();

  if (shots.length === 0 && !insights) {
    return {
      slug,
      checkedAt,
      totalShots: 0,
      uniqueShots: 0,
      nearDuplicateCount: 0,
      placeholderCount: 0,
      thinTotal: true,
      layers: (Object.keys(LAYER_MIN_UNIQUE) as CaptureLayer[]).map((layer) => ({
        layer,
        title: LAYER_TITLES[layer],
        targets: targetsForLayer(layer),
        shotCount: 0,
        uniqueCount: 0,
        thin: LAYER_MIN_UNIQUE[layer] > 0,
        minUnique: LAYER_MIN_UNIQUE[layer],
        evidence: [],
        sampleTitles: [],
      })),
      thinLayers: (Object.keys(LAYER_MIN_UNIQUE) as CaptureLayer[]).filter(
        (l) => LAYER_MIN_UNIQUE[l] > 0,
      ),
      issues: [
        {
          code: "missing-artifacts",
          severity: "error",
          message: `No capture data for ${slug}`,
        },
      ],
      score: 0,
      pass: false,
      summary: `FAIL — no capture artifacts for ${slug}`,
    };
  }

  const { count: nearDuplicateCount, pairs: dupPairs } =
    countNearDuplicates(shots);
  const uniqueShots = computeUniqueCount(shots, nearDuplicateCount);
  const thinTotal = uniqueShots < THIN_UNIQUE_TOTAL;

  if (thinTotal) {
    issues.push({
      code: "thin-total",
      severity: "error",
      message: `Only ${uniqueShots} unique screenshots (need ≥ ${THIN_UNIQUE_TOTAL})`,
    });
  }

  if (nearDuplicateCount > 0) {
    const nearDupRate =
      shots.length === 0 ? 0 : nearDuplicateCount / shots.length;
    issues.push({
      code: "near-duplicate",
      severity: nearDupRate >= 0.25 ? "error" : "warn",
      message: `${nearDuplicateCount} likely near-duplicate shot(s)`,
      shots: dupPairs.map(([a, b]) => `${a} ≈ ${b}`),
    });
  }

  const placeholders = shots.filter((s) => isPlaceholderLabel(s));
  const placeholderCount = placeholders.length;
  if (placeholderCount > 0) {
    const placeholderRate =
      shots.length === 0 ? 0 : placeholderCount / shots.length;
    issues.push({
      code: "placeholder-label",
      severity: placeholderRate >= 0.3 ? "error" : "warn",
      message: `${placeholderCount} shot(s) with placeholder / non-descriptive labels`,
      shots: placeholders.slice(0, 10).map((s) => s.title || s.file),
    });
  }

  // Bucket shots by layer
  const byLayer = new Map<CaptureLayer, ManifestShot[]>();
  for (const layer of Object.keys(LAYER_MIN_UNIQUE) as CaptureLayer[]) {
    byLayer.set(layer, []);
  }
  for (const shot of shots) {
    byLayer.get(assignLayer(shot))!.push(shot);
  }

  // Structure can also be satisfied by insights landmarks
  const landmarkEvidence =
    insights?.pages?.some((p) => (p.landmarks?.length ?? 0) > 0) ?? false;
  const sourceExpected = Boolean(
    insights?.techSignals?.some((t) =>
      /open[\s-]?source|github|storybook/i.test(t),
    ) ||
      shots.some((s) => assignLayer(s) === "source"),
  );

  const layers: LayerCoverage[] = (
    Object.keys(LAYER_MIN_UNIQUE) as CaptureLayer[]
  ).map((layer) => {
    const layerShots = byLayer.get(layer) ?? [];
    const layerNear = countNearDuplicates(layerShots).count;
    let uniqueCount = computeUniqueCount(layerShots, layerNear);
    const evidence: string[] = [];

    if (layerShots.length) {
      evidence.push(`${layerShots.length} screenshot(s)`);
    }

    if (layer === "structure" && landmarkEvidence) {
      evidence.push("insights landmarks");
      uniqueCount = Math.max(uniqueCount, 1);
    }

    if (layer === "source" && !sourceExpected) {
      evidence.push("optional (no open-source signals)");
    }

    const minUnique =
      layer === "source" && !sourceExpected ? 0 : LAYER_MIN_UNIQUE[layer];
    const thin = uniqueCount < minUnique;

    if (thin && minUnique > 0) {
      issues.push({
        code: "thin-layer",
        severity: layer === "surface" || layer === "component" ? "error" : "warn",
        message: `${LAYER_TITLES[layer]} layer thin: ${uniqueCount} unique (need ≥ ${minUnique})`,
        layer,
      });
    }

    return {
      layer,
      title: LAYER_TITLES[layer],
      targets: targetsForLayer(layer),
      shotCount: layerShots.length,
      uniqueCount,
      thin: thin && minUnique > 0,
      minUnique,
      evidence,
      sampleTitles: layerShots
        .slice(0, 5)
        .map((s) => s.title || s.file)
        .filter(Boolean),
    };
  });

  const thinLayers = layers.filter((l) => l.thin).map((l) => l.layer);
  const requiredThin = thinLayers.filter((l) => l !== "source");
  const placeholderRate =
    shots.length === 0 ? 1 : placeholderCount / shots.length;
  const nearDupRate =
    shots.length === 0 ? 0 : nearDuplicateCount / shots.length;

  const score = scoreReport({
    uniqueShots,
    thinLayers,
    requiredThin,
    placeholderRate,
    nearDupRate,
    hasInsights: Boolean(insights),
  });

  const hasError = issues.some((i) => i.severity === "error");
  const pass =
    !thinTotal &&
    !requiredThin.includes("surface") &&
    !requiredThin.includes("component") &&
    !hasError;

  const summary = pass
    ? `PASS — ${uniqueShots} unique / ${shots.length} total · score ${score}/100` +
      (thinLayers.length ? ` · thin: ${thinLayers.join(", ")}` : "")
    : `FAIL — ${uniqueShots} unique / ${shots.length} total · score ${score}/100` +
      (thinLayers.length ? ` · thin layers: ${thinLayers.join(", ")}` : "") +
      (thinTotal ? ` · below ${THIN_UNIQUE_TOTAL} unique` : "");

  return {
    slug,
    checkedAt,
    totalShots: shots.length,
    uniqueShots,
    nearDuplicateCount,
    placeholderCount,
    thinTotal,
    layers,
    thinLayers,
    issues,
    score,
    pass,
    summary,
  };
}

export function validateProductCapture(slug: string): CoverageReport {
  const dir = join(process.cwd(), "public/products", slug);

  if (!existsSync(dir)) {
    return validateCaptureData(slug, [], null);
  }

  const shots = loadManifestShots(dir);
  const insights = loadInsights(dir);
  return validateCaptureData(slug, shots, insights);
}

/** Map DB ProductScreenshot[] into ManifestShot shape for validation without disk. */
export function screenshotsToManifestShots(
  shots: ProductScreenshot[],
): ManifestShot[] {
  return shots.map((s) => ({
    file: screenshotFileName(s.src) ?? s.title,
    title: s.title,
    caption: s.caption,
    kind: s.kind,
    sourceUrl: s.sourceUrl,
    playbookStep: s.playbookStep,
    viewport: s.viewport,
    phash: s.phash,
    unique: s.unique,
    width: s.width,
    height: s.height,
  }));
}

export function formatCoverageReport(report: CoverageReport): string {
  const lines: string[] = [];
  lines.push(`\n══ Coverage · ${report.slug} ══`);
  lines.push(report.summary);
  lines.push(
    `  shots: ${report.totalShots} total · ${report.uniqueShots} unique · ${report.nearDuplicateCount} near-dup · ${report.placeholderCount} placeholder labels`,
  );
  lines.push("  layers:");
  for (const layer of report.layers) {
    const mark = layer.thin ? "✗ thin" : "✓";
    const evidence =
      layer.evidence.length > 0 ? ` [${layer.evidence.join("; ")}]` : "";
    lines.push(
      `    ${mark.padEnd(7)} ${layer.title.padEnd(12)} ${layer.uniqueCount}/${layer.minUnique} unique (${layer.shotCount} shots)${evidence}`,
    );
    if (layer.sampleTitles.length) {
      lines.push(`           e.g. ${layer.sampleTitles.slice(0, 3).join(" · ")}`);
    }
  }
  if (report.issues.length) {
    lines.push("  issues:");
    for (const issue of report.issues) {
      lines.push(`    [${issue.severity}] ${issue.code}: ${issue.message}`);
      if (issue.shots?.length) {
        for (const s of issue.shots.slice(0, 5)) {
          lines.push(`           · ${s}`);
        }
      }
    }
  }
  return lines.join("\n");
}
