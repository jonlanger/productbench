/**
 * Playwright UI capture agent for ProductBench — works for every catalog product.
 *
 * Captures:
 * - Screenshots (surfaces + components)
 * - Structured page insights (nav, CTAs, headings, tech/pattern signals)
 * - Soft-merges insights into product fields (metrics, patterns, features, platforms, tech)
 *
 * When live capture is thin or bot-blocked, runs web fallback:
 *   docs/help → OG/meta → thum.io → Wayback → YouTube frames → App Store
 *
 * Usage:
 *   npm run capture:ui -- --slug=notion
 *   npm run capture:ui -- --all [--limit=N] [--offset=N] [--skip-captured]
 *
 * Docs: https://playwright.dev/docs/intro
 */

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";
import { chromium, type Locator, type Page } from "playwright";

import { products as seedProducts } from "../src/data/products";
import type {
  CapturePageInsight,
  Platform,
  ProductMetrics,
  ProductScreenshot,
  ProductScreenshotKind,
  ProductUx,
} from "../src/data/types";
import {
  PRODUCT_VISUAL_SOURCES,
  flattenVisualSources,
} from "../src/data/visual-sources";
import { products as productsTable } from "../src/db/schema";
import {
  looksBlockedText,
  needsWebFallback,
  runWebFallback,
} from "./lib/capture-fallback";
import { ShotDedupeRegistry } from "./lib/image-dedupe";
import {
  aggregateInsights,
  detectPatterns,
  detectPlatforms,
  detectTechSignals,
  extractPageInsight,
  extractRawSignals,
} from "./lib/extract-page-insights";

config({ path: ".env.local" });
config();

type CaptureShot = {
  file: string;
  title: string;
  caption: string;
  kind: ProductScreenshotKind;
  sourceUrl: string;
  capturedAt: string;
  playbookStep: string;
  viewport?: { width: number; height: number };
  scrollY?: number;
  pageTitle?: string;
  width?: number;
  height?: number;
  phash?: string;
  unique: boolean;
};

type ShotSpec = {
  id: string;
  title: string;
  caption: string;
  kind: ProductScreenshotKind;
  /** Return one file, many files, or null if nothing useful was captured */
  run: (page: Page, dir: string) => Promise<string | string[] | null>;
};

type ProductTarget = {
  slug: string;
  name: string;
  website: string;
  keyScreens: string[];
  platforms: Platform[];
  techStack: string[];
  features: string[];
  ux: ProductUx;
  metrics: ProductMetrics;
};

function argFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function argValue(name: string) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

async function dismissNoise(page: Page) {
  const labels = [
    "Got it",
    "Accept",
    "Accept all",
    "Accept All",
    "I agree",
    "Agree",
    "OK",
    "Close",
    "Dismiss",
    "No thanks",
    "Not now",
  ];
  for (const label of labels) {
    const btn = page.getByRole("button", { name: label, exact: true });
    if (await btn.count()) {
      await btn.first().click({ timeout: 1200 }).catch(() => undefined);
    }
  }
  await page.keyboard.press("Escape").catch(() => undefined);
}

async function toJpeg(pngPath: string) {
  const jpgPath = pngPath.replace(/\.png$/i, ".jpg");
  try {
    const { execSync } = await import("child_process");
    execSync(
      `sips -s format jpeg -s formatOptions 82 "${pngPath}" --out "${jpgPath}"`,
      { stdio: "ignore" },
    );
    const { unlinkSync } = await import("fs");
    unlinkSync(pngPath);
    return jpgPath.split("/").pop()!;
  } catch {
    return pngPath.split("/").pop()!;
  }
}

async function saveJpeg(page: Page, pathWithoutExt: string, fullPage = false) {
  const pngPath = `${pathWithoutExt}.png`;
  await page.screenshot({ path: pngPath, fullPage, type: "png" });
  return toJpeg(pngPath);
}

async function saveLocatorJpeg(locator: Locator, pathWithoutExt: string) {
  const pngPath = `${pathWithoutExt}.png`;
  await locator.screenshot({ path: pngPath, type: "png" });
  return toJpeg(pngPath);
}

async function clickFirst(
  page: Page,
  candidates: Array<() => Locator>,
  timeout = 2000,
) {
  for (const make of candidates) {
    const loc = make();
    if ((await loc.count()) === 0) continue;
    const target = loc.first();
    if (!(await target.isVisible().catch(() => false))) continue;
    await target.click({ timeout }).catch(() => undefined);
    return true;
  }
  return false;
}

const CARD_SELECTOR = [
  '[data-testid*="card" i]',
  '[class*="Card" i]',
  "article",
  '[role="listitem"]',
  'a[href*="/rooms/"]',
  'li a[href]',
].join(", ");

const COMMON_PATHS = [
  "/pricing",
  "/product",
  "/products",
  "/features",
  "/platform",
  "/solutions",
  "/customers",
  "/docs",
  "/help",
  "/blog",
  "/about",
  "/login",
  "/signin",
  "/sign-in",
];

function absolutize(base: string, href: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "site";
  }
}

async function gotoReady(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1600);
  await dismissNoise(page);
  if (await pageLooksBlocked(page)) {
    throw new Error(`blocked:${hostLabel(url)}`);
  }
}

async function pageLooksBlocked(page: Page) {
  try {
    const text = await page.evaluate(() => {
      const title = document.title || "";
      const body = (document.body?.innerText || "").slice(0, 2500);
      return `${title}\n${body}`;
    });
    return looksBlockedText(text);
  } catch {
    return false;
  }
}

async function captureScrollBands(
  page: Page,
  dir: string,
  prefix: string,
  maxBands = 6,
) {
  const files: string[] = [];
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewport = page.viewportSize()?.height ?? 900;
  const step = Math.max(Math.floor(viewport * 0.72), 360);
  const positions = [0];

  for (let y = step; y < height - viewport * 0.35; y += step) {
    positions.push(y);
    if (positions.length >= maxBands - 1) break;
  }

  if (height > viewport * 1.4) {
    positions.push(Math.max(0, height - viewport));
  }

  const unique = positions.filter((y, index, all) => {
    if (index === 0) return true;
    return Math.abs(y - all[index - 1]!) > viewport * 0.28;
  });

  for (const [index, y] of unique.entries()) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(400);
    const suffix =
      index === 0
        ? "top"
        : index === unique.length - 1 && unique.length > 1
          ? "lower"
          : `band-${index + 1}`;
    const id = suffix === "top" ? `${prefix}-top` : suffix === "lower" ? `${prefix}-lower` : `${prefix}-${suffix}`;
    files.push(await saveJpeg(page, join(dir, id)));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return files;
}

async function captureCardCrops(page: Page, dir: string, max = 8) {
  const cards = page.locator(CARD_SELECTOR);
  const count = Math.min(await cards.count(), max * 3);
  const files: Array<{ file: string; index: number }> = [];
  const seen = new Set<string>();

  for (let i = 0; i < count && files.length < max; i++) {
    const card = cards.nth(i);
    if (!(await card.isVisible().catch(() => false))) continue;
    const box = await card.boundingBox();
    if (!box || box.width < 140 || box.height < 100) continue;
    if (box.width > 900) continue; // skip huge sections mistaken as cards
    const key = `${Math.round(box.width)}x${Math.round(box.height)}@${Math.round(box.x)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const file = await saveLocatorJpeg(card, join(dir, `card-${files.length + 1}`));
    files.push({ file, index: files.length + 1 });
  }
  return files;
}

async function collectSameOriginLinks(page: Page, origin: string, limit = 6) {
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => (a as HTMLAnchorElement).getAttribute("href") || "")
      .filter(Boolean),
  );

  const interesting =
    /pricing|product|feature|platform|solution|customer|docs|help|guide|login|signin|sign-in|demo|tour|blog|about|changelog|template|gallery|explore|resource/i;

  const out: string[] = [];
  const seen = new Set<string>();
  for (const href of hrefs) {
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    const abs = absolutize(origin, href);
    if (!abs || !abs.startsWith(origin)) continue;
    if (seen.has(abs)) continue;
    if (!interesting.test(abs) && !interesting.test(href)) continue;
    seen.add(abs);
    out.push(abs);
    if (out.length >= limit) break;
  }
  return out;
}

function guessCommonUrls(website: string) {
  let origin: string;
  try {
    origin = new URL(website).origin;
  } catch {
    return [] as string[];
  }
  return COMMON_PATHS.map((path) => `${origin}${path}`);
}

function buildGenericPlaybook(product: ProductTarget): ShotSpec[] {
  const sources = PRODUCT_VISUAL_SOURCES[product.slug];
  const homepageUrl = sources?.homepage ?? product.website;
  const documented = sources
    ? flattenVisualSources(sources).filter((url) => url !== homepageUrl)
    : [];
  // Prefer documented sources, then common path guesses — deeper crawl for 100+ unique shots
  const MAX_SURFACE_URLS = 22;
  const secondary = [
    ...documented,
    ...guessCommonUrls(homepageUrl).filter((url) => !documented.includes(url)),
  ].slice(0, MAX_SURFACE_URLS);

  const shots: ShotSpec[] = [
    {
      id: "homepage",
      title: product.keyScreens[0] ?? "Homepage",
      caption: `${product.name} public homepage (top of page)`,
      kind: "homepage",
      run: async (page, dir) => {
        await gotoReady(page, homepageUrl);
        return saveJpeg(page, join(dir, "homepage"));
      },
    },
    {
      id: "homepage-scroll",
      title: "Homepage depth",
      caption: `${product.name} homepage scrolled sections`,
      kind: "product",
      run: async (page, dir) => {
        await gotoReady(page, homepageUrl);
        return captureScrollBands(page, dir, "homepage");
      },
    },
    {
      id: "homepage-mobile",
      title: "Homepage mobile",
      caption: `${product.name} homepage at mobile viewport`,
      kind: "product",
      run: async (page, dir) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await gotoReady(page, homepageUrl);
        const file = await saveJpeg(page, join(dir, "homepage-mobile"));
        await page.setViewportSize({ width: 1440, height: 900 });
        return file;
      },
    },
    {
      id: "cards",
      title: "UI cards",
      caption: `Card / tile crops from ${product.name}`,
      kind: "component",
      run: async (page, dir) => {
        await gotoReady(page, homepageUrl);
        const crops = await captureCardCrops(page, dir, 6);
        return crops.length ? crops.map((c) => c.file) : null;
      },
    },
    {
      id: "search-composer",
      title: "Search / composer",
      caption: `Focused search or primary input on ${product.name}`,
      kind: "component",
      run: async (page, dir) => {
        await gotoReady(page, homepageUrl);
        const opened = await clickFirst(page, [
          () => page.getByRole("searchbox"),
          () => page.getByRole("combobox"),
          () => page.locator('input[type="search"], input[placeholder*="Search" i]'),
          () => page.getByRole("button", { name: /search|find|ask|command/i }),
        ]);
        if (!opened) return null;
        await page.waitForTimeout(500);
        return saveJpeg(page, join(dir, "search-composer"));
      },
    },
    {
      id: "account-menu",
      title: "Account / nav menu",
      caption: `Expanded account or primary navigation menu on ${product.name}`,
      kind: "component",
      run: async (page, dir) => {
        await gotoReady(page, homepageUrl);
        const opened = await clickFirst(page, [
          () =>
            page.getByRole("button", {
              name: /main navigation menu|account|profile|user menu|open menu|menu/i,
            }),
          () =>
            page.locator(
              'button[aria-label*="menu" i], button[aria-label*="account" i], button[aria-label*="profile" i]',
            ),
          () => page.getByRole("button", { name: /^menu$/i }),
        ]);
        if (!opened) return null;
        await page.waitForTimeout(500);
        return saveJpeg(page, join(dir, "account-menu"));
      },
    },
    {
      id: "sign-in",
      title: "Sign in",
      caption: `Sign in / log in UI on ${product.name} (pattern only — no credentials)`,
      kind: "component",
      run: async (page, dir) => {
        await gotoReady(page, homepageUrl);
        await clickFirst(page, [
          () =>
            page.getByRole("button", {
              name: /main navigation menu|account|profile|user menu|open menu|menu/i,
            }),
          () => page.locator('button[aria-label*="menu" i], button[aria-label*="account" i]'),
        ]);
        await page.waitForTimeout(400);

        const opened = await clickFirst(page, [
          () =>
            page.getByRole("link", {
              name: /log in|sign in|sign up|get started|log in or sign up/i,
            }),
          () => page.getByRole("button", { name: /log in|sign in|sign up|get started/i }),
          () =>
            page.locator(
              'a[href*="login" i], a[href*="signin" i], a[href*="sign-in" i], a[href*="signup" i]',
            ),
        ]);
        if (!opened) return null;
        await page.waitForTimeout(1500);

        const dialog = page.getByRole("dialog");
        if (
          (await dialog.count()) > 0 &&
          (await dialog.first().isVisible().catch(() => false))
        ) {
          return saveLocatorJpeg(dialog.first(), join(dir, "sign-in"));
        }
        return saveJpeg(page, join(dir, "sign-in"));
      },
    },
    {
      id: "nav-links",
      title: "In-product nav",
      caption: `Same-origin product / pricing / docs links from ${product.name}`,
      kind: "product",
      run: async (page, dir) => {
        await gotoReady(page, homepageUrl);
        let origin: string;
        try {
          origin = new URL(homepageUrl).origin;
        } catch {
          return null;
        }
        const links = await collectSameOriginLinks(page, origin, 12);
        const files: string[] = [];
        for (const [index, url] of links.entries()) {
          try {
            await gotoReady(page, url);
            files.push(await saveJpeg(page, join(dir, `nav-${index + 1}`)));
          } catch {
            /* skip dead links */
          }
        }
        return files.length ? files : null;
      },
    },
  ];

  for (const [index, url] of secondary.entries()) {
    const screenTitle =
      product.keyScreens[index + 1] ?? `Supporting surface ${index + 1}`;
    shots.push({
      id: `surface-${index + 1}`,
      title: screenTitle,
      caption: `${product.name} public surface · ${hostLabel(url)}`,
      kind: index < 2 ? "product" : "docs",
      run: async (page, dir) => {
        try {
          await gotoReady(page, url);
        } catch {
          return null;
        }
        const top = await saveJpeg(page, join(dir, `surface-${index + 1}`));
        const bands = await captureScrollBands(
          page,
          dir,
          `surface-${index + 1}`,
          5,
        );
        return [top, ...bands.filter((file) => file !== top)];
      },
    });
  }

  return shots;
}

/** Richer Airbnb-specific flows; optional override. */
function buildAirbnbPlaybook(): ShotSpec[] {
  return [
    {
      id: "home-search",
      title: "Home/search",
      caption: "Guest homepage with search bar, category tabs, and listing carousels",
      kind: "homepage",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/");
        return saveJpeg(page, join(dir, "home-search"));
      },
    },
    {
      id: "home-scroll",
      title: "Homepage depth",
      caption: "Airbnb homepage scrolled carousels and destination inspiration",
      kind: "product",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/");
        return captureScrollBands(page, dir, "home");
      },
    },
    {
      id: "home-mobile",
      title: "Homepage mobile",
      caption: "Airbnb homepage at mobile viewport",
      kind: "product",
      run: async (page, dir) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await gotoReady(page, "https://www.airbnb.com/");
        const file = await saveJpeg(page, join(dir, "home-mobile"));
        await page.setViewportSize({ width: 1440, height: 900 });
        return file;
      },
    },
    {
      id: "listing-cards",
      title: "Listing cards",
      caption: "Listing card crops: photo, badges, heart, price, rating",
      kind: "component",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/");
        const crops = await captureCardCrops(page, dir, 5);
        return crops.length ? crops.map((c) => c.file) : null;
      },
    },
    {
      id: "search-composer",
      title: "Search composer",
      caption: "Where / When / Who search bar expanded",
      kind: "component",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/");
        await page.getByRole("searchbox", { name: /where/i }).click().catch(() => undefined);
        await page.waitForTimeout(600);
        return saveJpeg(page, join(dir, "search-composer"));
      },
    },
    {
      id: "profile-menu",
      title: "Profile menu",
      caption: "Account chrome: help, host promo, gift cards, log in / sign up",
      kind: "component",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/");
        await page.getByRole("button", { name: /main navigation menu/i }).click();
        await page.waitForTimeout(600);
        return saveJpeg(page, join(dir, "profile-menu"));
      },
    },
    {
      id: "sign-in-modal",
      title: "Sign in modal",
      caption: "Auth dialog: continue with email / social providers (UI only, no credentials)",
      kind: "component",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/");
        await page.getByRole("button", { name: /main navigation menu/i }).click();
        await page.getByRole("link", { name: /log in or sign up/i }).click();
        await page.waitForTimeout(1500);
        const dialog = page.getByRole("dialog");
        if (await dialog.count()) {
          return saveLocatorJpeg(dialog.first(), join(dir, "sign-in-modal"));
        }
        return saveJpeg(page, join(dir, "sign-in-modal"));
      },
    },
    {
      id: "search-results",
      title: "Search results",
      caption: "Paris search results with amenity filters, listing cards, and map price pins",
      kind: "product",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/s/Paris--France/homes");
        const top = await saveJpeg(page, join(dir, "search-results"));
        await page.evaluate(() => window.scrollBy(0, 700));
        await page.waitForTimeout(500);
        await saveJpeg(page, join(dir, "search-results-mid"));
        return [top, "search-results-mid.jpg"];
      },
    },
    {
      id: "filters",
      title: "Filters",
      caption: "Search filters sheet / panel",
      kind: "component",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/s/Paris--France/homes");
        const opened = await clickFirst(page, [
          () => page.getByRole("button", { name: /filters/i }),
        ]);
        if (!opened) return null;
        await page.waitForTimeout(800);
        const dialog = page.getByRole("dialog");
        if (await dialog.count()) {
          return saveLocatorJpeg(dialog.first(), join(dir, "filters"));
        }
        return saveJpeg(page, join(dir, "filters"));
      },
    },
    {
      id: "listing-detail",
      title: "Listing detail",
      caption: "Listing photo gallery, host summary, and reserve booking card",
      kind: "product",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/s/Paris--France/homes");
        const href = await page
          .locator('a[href*="/rooms/"]')
          .first()
          .getAttribute("href");
        if (!href) return null;
        await gotoReady(page, new URL(href, "https://www.airbnb.com").toString());
        await page.evaluate(() => {
          document.querySelectorAll('[role="dialog"]').forEach((node) => {
            const text = node.textContent ?? "";
            if (/translation/i.test(text)) (node as HTMLElement).remove();
          });
        });
        const files = await captureScrollBands(page, dir, "listing");
        return files;
      },
    },
    {
      id: "experiences",
      title: "Experiences",
      caption: "Experiences browse with filters and themed activity carousels",
      kind: "product",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/s/experiences");
        return captureScrollBands(page, dir, "experiences");
      },
    },
    {
      id: "host-landing",
      title: "Host dashboard",
      caption: "Host earnings estimator with nearby rate map (public host onboarding)",
      kind: "product",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/host/homes");
        await page.evaluate(() => {
          document.querySelectorAll("button").forEach((b) => {
            if (/close/i.test(b.getAttribute("aria-label") ?? "")) b.click();
          });
        });
        await page.waitForTimeout(400);
        return captureScrollBands(page, dir, "host");
      },
    },
    {
      id: "help",
      title: "Help center",
      caption: "Airbnb Help Center public support surface",
      kind: "docs",
      run: async (page, dir) => {
        await gotoReady(page, "https://www.airbnb.com/help");
        return captureScrollBands(page, dir, "help");
      },
    },
  ];
}

const SPECIFIC_PLAYBOOKS: Record<string, () => ShotSpec[]> = {
  airbnb: buildAirbnbPlaybook,
};

function playbookFor(product: ProductTarget): ShotSpec[] {
  const specific = SPECIFIC_PLAYBOOKS[product.slug];
  return specific ? specific() : buildGenericPlaybook(product);
}

async function loadTargets(slugFilter?: string): Promise<ProductTarget[]> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const client = postgres(url, { prepare: false, max: 1, ssl: "require" });
    const db = drizzle(client);
    const rows = await db
      .select({
        slug: productsTable.slug,
        name: productsTable.name,
        website: productsTable.website,
        platforms: productsTable.platforms,
        techStack: productsTable.techStack,
        features: productsTable.features,
        ux: productsTable.ux,
        metrics: productsTable.metrics,
      })
      .from(productsTable);
    await client.end();

    return rows
      .filter((row) => (slugFilter ? row.slug === slugFilter : true))
      .map((row) => ({
        slug: row.slug,
        name: row.name,
        website: row.website,
        keyScreens: row.ux?.keyScreens ?? [],
        platforms: row.platforms ?? [],
        techStack: row.techStack ?? [],
        features: row.features ?? [],
        ux: row.ux,
        metrics: row.metrics,
      }));
  }

  return seedProducts
    .filter((product) => (slugFilter ? product.slug === slugFilter : true))
    .map((product) => ({
      slug: product.slug,
      name: product.name,
      website: product.website,
      keyScreens: product.ux.keyScreens ?? [],
      platforms: product.platforms,
      techStack: product.techStack,
      features: product.features,
      ux: product.ux,
      metrics: product.metrics,
    }));
}

function mergeUnique(existing: string[], incoming: string[], maxExtra = 12) {
  const seen = new Set(existing.map((v) => v.toLowerCase()));
  const merged = [...existing];
  for (const value of incoming) {
    if (seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    merged.push(value);
    if (merged.length >= existing.length + maxExtra) break;
  }
  return merged;
}

async function syncDb(
  product: ProductTarget,
  shots: CaptureShot[],
  insights: ReturnType<typeof aggregateInsights>,
) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL not set — skipping DB sync");
    return;
  }

  const screenshots: ProductScreenshot[] = shots.map((shot) => ({
    title: shot.title,
    src: `/products/${product.slug}/${shot.file}`,
    caption: shot.caption,
    kind: shot.kind,
    sourceUrl: shot.sourceUrl,
    capturedAt: shot.capturedAt,
    viewport: shot.viewport,
    scrollY: shot.scrollY,
    pageTitle: shot.pageTitle,
    width: shot.width,
    height: shot.height,
    phash: shot.phash,
    playbookStep: shot.playbookStep,
    unique: shot.unique,
  }));

  const platforms = mergeUnique(
    product.platforms,
    insights.platformsDetected,
    4,
  ) as Platform[];
  const techStack = mergeUnique(product.techStack, insights.techSignals, 8);
  const features = mergeUnique(
    product.features,
    insights.featureCandidates.filter(
      (f) => !/cookie|privacy|accept all|copyright/i.test(f),
    ),
    10,
  );
  const patterns = mergeUnique(
    product.ux.patterns,
    insights.patternCandidates,
    8,
  );
  const keyScreens = mergeUnique(
    product.ux.keyScreens,
    shots.map((s) => s.title).filter((t) => !/\(\d+\)$/.test(t)),
    8,
  );

  const ux: ProductUx = {
    ...product.ux,
    patterns,
    keyScreens,
  };

  const client = postgres(url, { prepare: false, max: 1, ssl: "require" });
  const db = drizzle(client);

  // Soft-merge screenshots so a thin re-capture doesn't wipe prior assets
  const existing = await db
    .select({ screenshots: productsTable.screenshots })
    .from(productsTable)
    .where(eq(productsTable.slug, product.slug));
  const prior = (existing[0]?.screenshots as ProductScreenshot[] | null) ?? [];
  const bySrc = new Map<string, ProductScreenshot>();
  for (const shot of prior) {
    if (shot?.src) bySrc.set(shot.src, shot);
  }
  for (const shot of screenshots) {
    bySrc.set(shot.src, shot);
  }
  const mergedScreenshots = [...bySrc.values()];

  const metrics: ProductMetrics = {
    ...product.metrics,
    screenCount: Math.max(
      product.metrics.screenCount,
      mergedScreenshots.length,
    ),
    pageCount: Math.max(product.metrics.pageCount, insights.pageCount),
    featureCount: Math.max(product.metrics.featureCount, features.length),
  };

  await db
    .update(productsTable)
    .set({
      screenshots: mergedScreenshots,
      captureInsights: insights,
      platforms,
      techStack,
      features,
      ux,
      metrics,
      updatedAt: new Date(),
    })
    .where(eq(productsTable.slug, product.slug));
  await client.end();
  console.log(
    `  synced ${mergedScreenshots.length} shots + insights → DB (features +${features.length - product.features.length}, patterns +${patterns.length - product.ux.patterns.length}; kept ${prior.length} prior)`,
  );
}

async function notePage(
  page: Page,
  bag: {
    pages: Map<string, CapturePageInsight>;
    tech: Set<string>;
    patterns: Set<string>;
    platforms: Set<Platform>;
  },
) {
  try {
    const insight = await extractPageInsight(page);
    const key = insight.url.split("?")[0] ?? insight.url;
    if (!bag.pages.has(key)) bag.pages.set(key, insight);

    const raw = await extractRawSignals(page);
    const blob = `${raw.scripts}\n${raw.classes}\n${raw.textSample}\n${insight.title}\n${insight.headings.join(" ")}`;
    for (const signal of detectTechSignals(blob)) bag.tech.add(signal);
    for (const pattern of detectPatterns(blob)) bag.patterns.add(pattern);
    for (const platform of detectPlatforms(blob)) bag.platforms.add(platform);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  insight miss: ${message.slice(0, 100)}`);
  }
}

async function captureProduct(
  page: Page,
  product: ProductTarget,
): Promise<CaptureShot[]> {
  const dir = join(process.cwd(), "public/products", product.slug);
  mkdirSync(dir, { recursive: true });

  const shots = playbookFor(product);
  const mode = SPECIFIC_PLAYBOOKS[product.slug] ? "specific" : "generic";
  console.log(`\n${product.slug} (${mode}, ${shots.length} steps)`);

  const captured: CaptureShot[] = [];
  let skippedDuplicates = 0;
  let blockedNavigations = 0;
  const capturedAt = new Date().toISOString();
  const dedupe = new ShotDedupeRegistry(10, (filePath) => {
    dedupe.removeDuplicate(filePath);
    skippedDuplicates += 1;
  });
  const bag = {
    pages: new Map<string, CapturePageInsight>(),
    tech: new Set<string>(),
    patterns: new Set<string>(),
    platforms: new Set<Platform>(["web"]),
  };

  for (const shot of shots) {
    process.stdout.write(`  ${shot.id}… `);
    try {
      const result = await shot.run(page, dir);
      const files = Array.isArray(result)
        ? result
        : result
          ? [result]
          : [];
      if (files.length === 0) {
        console.log("skipped");
        continue;
      }

      const saved: string[] = [];
      const viewport = page.viewportSize() ?? undefined;
      const scrollY = await page
        .evaluate(() => window.scrollY)
        .catch(() => 0);
      const pageTitle = await page.title().catch(() => "");
      const sourceUrl = page.url();

      for (const [index, file] of files.entries()) {
        const fullPath = join(dir, file);
        const hash = await dedupe.register(fullPath);
        if (!hash.unique) continue;

        captured.push({
          file,
          title:
            files.length > 1 ? `${shot.title} (${index + 1})` : shot.title,
          caption: shot.caption,
          kind: shot.kind,
          sourceUrl,
          capturedAt,
          playbookStep: shot.id,
          viewport: viewport
            ? { width: viewport.width, height: viewport.height }
            : undefined,
          scrollY,
          pageTitle,
          width: hash.width,
          height: hash.height,
          phash: hash.phash,
          unique: true,
        });
        saved.push(file);
      }

      if (saved.length === 0) {
        console.log("skipped (duplicates)");
        continue;
      }

      await notePage(page, bag);
      console.log(saved.join(", "));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith("blocked:")) blockedNavigations += 1;
      console.log(`failed (${message.slice(0, 80)})`);
    }
  }

  if (skippedDuplicates > 0) {
    console.log(`  deduped ${skippedDuplicates} near-duplicate shot(s)`);
  }

  if (needsWebFallback(captured.length, blockedNavigations, product.slug)) {
    console.log(
      `  live capture thin (${captured.length} shots, ${blockedNavigations} blocked) — running web fallback`,
    );
    try {
      const fallback = await runWebFallback({
        slug: product.slug,
        website: product.website,
        dir,
        existingCount: captured.length,
      });
      for (const shot of fallback) {
        const fullPath = join(dir, shot.file);
        const hash = await dedupe.register(fullPath);
        if (!hash.unique) continue;
        captured.push({
          ...shot,
          capturedAt,
          playbookStep: "web-fallback",
          width: hash.width,
          height: hash.height,
          phash: hash.phash,
          unique: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`  fallback failed: ${message.slice(0, 120)}`);
    }
  }

  const insights = aggregateInsights({
    pages: [...bag.pages.values()],
    screenshotCount: captured.length,
    techSignals: [...bag.tech],
    patternCandidates: [...bag.patterns],
    platformsDetected: [...bag.platforms],
  });

  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify(
      {
        slug: product.slug,
        capturedAt: insights.capturedAt,
        shots: captured,
        insights,
        fallback:
          blockedNavigations > 0 || captured.some((s) => s.file.startsWith("fallback-"))
            ? { blockedNavigations }
            : undefined,
      },
      null,
      2,
    ),
  );
  writeFileSync(join(dir, "insights.json"), JSON.stringify(insights, null, 2));

  await syncDb(product, captured, insights);
  return captured;
}

async function main() {
  const slug = argValue("slug");
  const runAll = argFlag("all");
  const limit = Number(argValue("limit") ?? "0");
  const offset = Number(argValue("offset") ?? "0");
  const skipCaptured = argFlag("skip-captured");

  if (!slug && !runAll) {
    console.error(
      [
        "Usage:",
        "  npm run capture:ui -- --slug=<product>",
        "  npm run capture:ui -- --all [--limit=N] [--offset=N] [--skip-captured]",
        "  npm run capture:ui -- --slug=notion --headed",
      ].join("\n"),
    );
    process.exit(1);
  }

  let targets = await loadTargets(runAll ? undefined : slug);
  if (targets.length === 0) {
    console.error(slug ? `No product found for slug "${slug}"` : "No products found");
    process.exit(1);
  }

  if (skipCaptured) {
    const before = targets.length;
    targets = targets.filter(
      (product) =>
        !existsSync(
          join(process.cwd(), "public/products", product.slug, "manifest.json"),
        ),
    );
    console.log(`Skipping ${before - targets.length} already-captured products`);
  }

  if (offset > 0) {
    targets = targets.slice(offset);
    console.log(`Offset ${offset} — ${targets.length} products remaining`);
  }

  const queue = limit > 0 ? targets.slice(0, limit) : targets;

  if (queue.length === 0) {
    console.log("Nothing to capture.");
    process.exit(0);
  }

  console.log(`Capturing ${queue.length} product(s)…`);

  const browser = await chromium.launch({ headless: !argFlag("headed") });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 ProductBenchCapture/0.1",
  });
  const page = await context.newPage();

  const summary: Array<{ slug: string; count: number }> = [];
  for (const product of queue) {
    const captured = await captureProduct(page, product);
    summary.push({ slug: product.slug, count: captured.length });
  }

  await browser.close();

  console.log("\nDone:");
  for (const row of summary) {
    console.log(`  ${row.slug}: ${row.count} shots`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
