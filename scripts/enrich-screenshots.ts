import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { writeFileSync } from "fs";
import postgres from "postgres";

import type { ProductScreenshot, ProductScreenshotKind } from "../src/data/types";
import {
  flattenVisualSources,
  PRODUCT_VISUAL_SOURCES,
} from "../src/data/visual-sources";
import { products as productsTable } from "../src/db/schema";

config({ path: ".env.local" });
config();

type Candidate = {
  src: string;
  alt: string;
  score: number;
  width?: number;
  height?: number;
};

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absolutize(base: string, value: string | undefined | null) {
  if (!value) return null;
  try {
    return new URL(decodeEntities(value), base).toString();
  } catch {
    return null;
  }
}

function parseSizeHint(src: string): { width?: number; height?: number } {
  const lower = src.toLowerCase();
  const pair = lower.match(/(?:^|[^\d])(\d{3,4})x(\d{3,4})(?:[^\d]|$)/);
  if (pair) {
    return { width: Number(pair[1]), height: Number(pair[2]) };
  }
  const wOnly = lower.match(/[?&](?:w|width)=(\d{3,4})\b/);
  const hOnly = lower.match(/[?&](?:h|height)=(\d{3,4})\b/);
  return {
    width: wOnly ? Number(wOnly[1]) : undefined,
    height: hOnly ? Number(hOnly[1]) : undefined,
  };
}

/** Hard rejects for logos, icons, badges, and non-UI chrome. */
function isRejectedAsset(src: string, alt = "") {
  const hay = `${src} ${alt}`.toLowerCase();

  if (hay.startsWith("data:")) return true;
  if (/\.svg(\?|#|$)/i.test(src)) return true;
  if (/\.gif(\?|#|$)/i.test(src)) return true;

  return [
    /logo/,
    /wordmark/,
    /brand[-_]?mark/,
    /favicon/,
    /sprite/,
    /emoji/,
    /avatar/,
    /\/icons?\//,
    /icon[-_/]/,
    /get_started_icons/,
    /badge/,
    /button[-_]?/,
    /spinner/,
    /loader/,
    /placeholder/,
    /1x1/,
    /pixel/,
    /tracking/,
    /spacer/,
    /divider/,
    /chevron/,
    /arrow[-_]?(?:left|right|up|down)/,
    /social[-_]?card/,
    /og[-_]?image/,
    /opengraph/,
    /twitter[-_]?card/,
    /social[-_]?share/,
    /share[-_]?image/,
    /meta[-_]?image/,
    /whats[-_]?new\.png/,
    /warning\.png/,
    /sprocket/,
    /favicon/,
    /apple[-_]?touch/,
    /ms[-_]?icon/,
    /thumb\.500\.500/,
    /\/small[-_]/,
    /-small\./,
    /_small\./,
    /\/flags?\//,
    /flag[-_]/,
    /emoji/,
    /gravatar/,
    /profile[-_]?photo/,
    /headshot/,
    /illustration[-_]?icon/,
    /pictogram/,
  ].some((re) => re.test(hay));
}

function looksLikeProductUi(src: string, alt = "") {
  const hay = `${src} ${alt}`.toLowerCase();
  return [
    /screenshot/,
    /screen[-_]?shot/,
    /product[-_]?ui/,
    /dashboard/,
    /interface/,
    /canvas/,
    /editor/,
    /workspace/,
    /board[-_]?view/,
    /kanban/,
    /timeline/,
    /inbox/,
    /composer/,
    /modal/,
    /dialog/,
    /settings[-_]?page/,
    /admin/,
    /console/,
    /app[-_]?window/,
    /ui[-_]?capture/,
    /in[-_]?product/,
    /workflow/,
    /pipeline/,
    /issue[-_]?/,
    /pull[-_]?request/,
    /merge[-_]?request/,
    /figma/,
    /snowsight/,
    /hyperspace/,
    /\/docs\/.*\.(png|jpe?g|webp)/,
    /webassets\.linear\.app/,
    /cdn\.sanity\.io/,
    /files\.readme\.io/,
    /ctfassets\.net/,
    /mintcdn\.com/,
  ].some((re) => re.test(hay));
}

function scoreCandidate(src: string, alt: string): number | null {
  if (isRejectedAsset(src, alt)) return null;

  const { width, height } = parseSizeHint(src);
  if (width && width < 480) return null;
  if (height && height < 280) return null;
  if (width && height && width / height > 3.2) return null; // banner/logo strips
  if (width && height && height / width > 2.4) return null;

  let score = 0;
  if (looksLikeProductUi(src, alt)) score += 8;
  if (width && height) {
    score += Math.min(6, Math.floor((width * height) / 250_000));
    if (width >= 900 && height >= 500) score += 4;
    if (width >= 1200 && height >= 700) score += 3;
  } else {
    // Unknown size: only keep if alt/src strongly suggests UI
    if (!looksLikeProductUi(src, alt)) score -= 4;
  }

  if (/screenshot|screen shot|product ui|dashboard|composer|board/i.test(alt)) {
    score += 5;
  }
  if (/logo|icon|badge|mark/i.test(alt)) score -= 10;

  // Prefer raster product captures from doc CDNs
  if (/\.(png|jpe?g|webp)(\?|$)/i.test(src)) score += 1;

  return score >= 4 ? score : null;
}

function extractImages(html: string, pageUrl: string): Candidate[] {
  const found: Candidate[] = [];
  const seen = new Set<string>();

  const patterns = [
    /<img\b[^>]*>/gi,
    /!\[[^\]]*\]\(([^)]+)\)/g,
  ];

  // Prefer in-content <img> over OG/meta (those are usually logos/brand cards)
  for (const match of html.matchAll(patterns[0])) {
    const tag = match[0];
    const srcMatch =
      tag.match(/(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i) ??
      tag.match(/(?:srcset)=["']([^"'\s]+)/i);
    if (!srcMatch) continue;
    const src = absolutize(pageUrl, srcMatch[1]);
    if (!src || seen.has(src)) continue;
    const alt = tag.match(/alt=["']([^"']*)["']/i)?.[1] ?? "";
    const widthAttr = Number(tag.match(/width=["']?(\d+)/i)?.[1] ?? NaN);
    const heightAttr = Number(tag.match(/height=["']?(\d+)/i)?.[1] ?? NaN);
    const size = parseSizeHint(src);
    const width = size.width ?? (Number.isFinite(widthAttr) ? widthAttr : undefined);
    const height =
      size.height ?? (Number.isFinite(heightAttr) ? heightAttr : undefined);

    // Skip tiny attributed images immediately
    if (width && width < 480) continue;
    if (height && height < 280) continue;

    const score = scoreCandidate(src, alt);
    if (score == null) continue;
    seen.add(src);
    found.push({ src, alt, score, width, height });
  }

  for (const match of html.matchAll(patterns[1])) {
    const src = absolutize(pageUrl, match[1]);
    if (!src || seen.has(src)) continue;
    const score = scoreCandidate(src, "");
    if (score == null) continue;
    seen.add(src);
    found.push({ src, alt: "", score, ...parseSizeHint(src) });
  }

  return found.sort((a, b) => b.score - a.score);
}

async function probeImageBytes(src: string): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const head = await fetch(src, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "ProductBenchResearchBot/0.3 (+local research; image quality probe)",
      },
    });
    if (!head.ok) return null;
    const type = head.headers.get("content-type") ?? "";
    if (type && !type.startsWith("image/")) return null;
    if (type.includes("svg")) return null;
    const length = Number(head.headers.get("content-length") ?? NaN);
    return Number.isFinite(length) ? length : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function keepHighQuality(candidates: Candidate[], limit: number) {
  const kept: Candidate[] = [];
  for (const candidate of candidates) {
    if (kept.length >= limit) break;
    // If we already know it's a large UI frame, keep without probing
    if (
      candidate.width &&
      candidate.height &&
      candidate.width >= 800 &&
      candidate.height >= 450 &&
      candidate.score >= 6
    ) {
      kept.push(candidate);
      continue;
    }

    const bytes = await probeImageBytes(candidate.src);
    if (bytes != null && bytes < 25_000) continue; // tiny = icon/logo
    if (bytes != null && bytes > 25_000) {
      kept.push({ ...candidate, score: candidate.score + 2 });
      continue;
    }
    // Unknown size/bytes: only keep strong UI signals
    if (candidate.score >= 8) kept.push(candidate);
  }
  return kept;
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "ProductBenchResearchBot/0.3 (+local research; collecting public product visuals)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function homepageShot(website: string): ProductScreenshot {
  return {
    title: "Homepage",
    src: `https://image.thum.io/get/width/1400/noanimate/${encodeURIComponent(website)}`,
    caption: "Marketing homepage snapshot",
    kind: "homepage",
    sourceUrl: website,
  };
}

function pushUnique(
  list: ProductScreenshot[],
  shot: ProductScreenshot,
  max = 16,
) {
  if (list.length >= max) return;
  if (list.some((item) => item.src === shot.src)) return;
  list.push(shot);
}

async function enrichProduct(row: {
  id: string;
  slug: string;
  name: string;
  website: string;
  keyScreens: string[];
}) {
  const sources = PRODUCT_VISUAL_SOURCES[row.slug];
  const homepageUrl = sources?.homepage ?? row.website;
  const docs = sources ? flattenVisualSources(sources) : [];
  const shots: ProductScreenshot[] = [];
  const uiPool: ProductScreenshot[] = [];

  pushUnique(shots, homepageShot(homepageUrl));

  for (const docUrl of docs) {
    try {
      const html = await fetchHtml(docUrl);
      const candidates = extractImages(html, docUrl);
      const quality = await keepHighQuality(candidates, 8);
      const host = new URL(docUrl).hostname;
      const bucket =
        sources?.technical?.includes(docUrl)
          ? "technical"
          : sources?.supporting?.includes(docUrl)
            ? "supporting"
            : sources?.releases?.includes(docUrl)
              ? "releases"
              : "help";

      for (const image of quality) {
        const kind: ProductScreenshotKind =
          bucket === "technical"
            ? "technical"
            : bucket === "supporting"
              ? "supporting"
              : "docs";
        const title =
          image.alt.trim() ||
          `Product UI from ${bucket} docs (${host})`;
        const shot: ProductScreenshot = {
          title: title.slice(0, 90),
          src: image.src,
          caption: `Public ${bucket} document: ${docUrl}`,
          kind,
          sourceUrl: docUrl,
        };
        pushUnique(shots, shot, 16);
        pushUnique(uiPool, shot, 16);
        if (uiPool.length >= 10) break;
      }
      if (uiPool.length >= 10) break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`  docs miss ${row.slug} ← ${docUrl}: ${message}`);
    }
  }

  // Map key screens only onto verified UI captures — never logos/homepage fillers
  for (const [index, screen] of row.keyScreens.entries()) {
    if (shots.some((s) => s.title === screen)) continue;
    const donor = uiPool[index % Math.max(uiPool.length, 1)];
    if (!donor) continue;
    pushUnique(shots, {
      title: screen,
      src: donor.src,
      caption: `Key screen “${screen}” · sourced from ${donor.sourceUrl ?? "docs"}`,
      kind: "product",
      sourceUrl: donor.sourceUrl,
    });
  }

  const rank: Record<ProductScreenshotKind, number> = {
    homepage: 0,
    technical: 1,
    supporting: 2,
    docs: 3,
    product: 4,
    component: 5,
    marketing: 6,
  };

  shots.sort((a, b) => {
    const ka = rank[a.kind ?? "marketing"];
    const kb = rank[b.kind ?? "marketing"];
    if (ka !== kb) return ka - kb;
    return a.title.localeCompare(b.title);
  });

  return shots;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const client = postgres(url, { prepare: false, max: 1, ssl: "require" });
  const db = drizzle(client);

  const rows = await db
    .select({
      id: productsTable.id,
      slug: productsTable.slug,
      name: productsTable.name,
      website: productsTable.website,
      ux: productsTable.ux,
    })
    .from(productsTable);

  const report: Array<{ slug: string; counts: Record<string, number> }> = [];

  for (const row of rows) {
    const keyScreens = row.ux?.keyScreens ?? [];
    console.log(`Enriching ${row.slug}…`);
    const screenshots = await enrichProduct({
      id: row.id,
      slug: row.slug,
      name: row.name,
      website: row.website,
      keyScreens,
    });

    await db
      .update(productsTable)
      .set({ screenshots, updatedAt: new Date() })
      .where(eq(productsTable.id, row.id));

    const counts = screenshots.reduce<Record<string, number>>((acc, shot) => {
      const kind = shot.kind ?? "unknown";
      acc[kind] = (acc[kind] ?? 0) + 1;
      return acc;
    }, {});
    report.push({ slug: row.slug, counts });
    console.log(`  → ${screenshots.length} shots`, counts);
  }

  writeFileSync(
    "src/data/collected-screenshots.json",
    JSON.stringify(report, null, 2),
  );
  console.log(`\nEnriched ${rows.length} products.`);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
