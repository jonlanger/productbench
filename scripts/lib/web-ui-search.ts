/**
 * Playwright-driven discovery of public product UI examples.
 *
 * Homepages and help centers are often bot-walled / access-denied. This module
 * uses a live Chromium page to broaden the surface set by:
 *   1. Harvesting design-system / component-library nav links
 *   2. Searching YouTube for official demos (thumbnails / frames via fallback)
 *   3. Light Brave/Bing organic search (best-effort; often empty headless)
 *   4. Expanding from seed URLs (marketing / Trailhead / docs) via on-page links
 *
 * Returns URL candidates the capture playbook can visit and screenshot.
 */

import type { Page } from "playwright";

export type WebUiCandidate = {
  url: string;
  label: string;
  via:
    | "design-system-crawl"
    | "youtube-search"
    | "web-search"
    | "seed-expand"
    | "curated";
  kind: "component" | "product" | "docs" | "marketing" | "video";
};

const BLOCKED_HOST_RE =
  /accounts\.google|login\.|signin\.|auth\.|okta\.com|microsoftonline|brave\.com\/(settings|search|images|news|videos|maps|ask|goggles)/i;

const UI_LINK_RE =
  /component|blueprint|pattern|guideline|token|foundation|button|modal|table|list|form|nav|header|card|path|pipeline|dashboard|record|setup|flow|lightning|design.?system|feature|capability|demo|screenshot|ui|ux|experience/i;

function normalizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    u.hash = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|bc$|pp$|source$)/i.test(key) || key === "bc") {
        u.searchParams.delete(key);
      }
    }
    return u.toString();
  } catch {
    return null;
  }
}

function pushUnique(
  out: WebUiCandidate[],
  seen: Set<string>,
  candidate: WebUiCandidate,
) {
  const normalized = normalizeUrl(candidate.url);
  if (!normalized || seen.has(normalized)) return;
  if (BLOCKED_HOST_RE.test(normalized)) return;
  if (!/^https?:\/\//i.test(normalized)) return;
  seen.add(normalized);
  out.push({ ...candidate, url: normalized });
}

async function softGoto(page: Page, url: string, settleMs = 1800) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
  await page.waitForTimeout(settleMs);
}

/**
 * Crawl a design-system / component docs site and harvest component-ish links.
 */
export async function harvestDesignSystemLinks(
  page: Page,
  rootUrl: string,
  options?: { limit?: number },
): Promise<WebUiCandidate[]> {
  const limit = options?.limit ?? 18;
  const out: WebUiCandidate[] = [];
  const seen = new Set<string>();

  try {
    await softGoto(page, rootUrl, 2200);
  } catch {
    return out;
  }

  for (const name of ["Components", "Component", "Blueprints", "Patterns"]) {
    const link = page.getByRole("link", { name, exact: true }).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click({ timeout: 2000 }).catch(() => undefined);
      await page.waitForTimeout(1200);
      break;
    }
  }

  const harvested = await page.evaluate(() => {
    const items: Array<{ href: string; text: string }> = [];
    for (const a of document.querySelectorAll("a[href]")) {
      const el = a as HTMLAnchorElement;
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!text || text.length > 80) continue;
      items.push({ href: el.href, text });
    }
    return items;
  });

  let rootHost = "";
  try {
    rootHost = new URL(rootUrl).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }

  for (const item of harvested) {
    if (out.length >= limit) break;
    const href = item.href;
    if (rootHost && !href.includes(rootHost)) continue;
    const hay = `${item.text} ${href}`;
    if (!UI_LINK_RE.test(hay) && !/\/p\/[a-z0-9-]+/i.test(href)) continue;
    if (/^(home|skip to|sign in|log in|get started)$/i.test(item.text)) continue;
    pushUnique(out, seen, {
      url: href,
      label: item.text.slice(0, 80),
      via: "design-system-crawl",
      kind: "component",
    });
  }

  return out;
}

/**
 * Best-effort organic web search via Brave / Bing (falls back silently when empty).
 */
export async function searchWebUiExamples(
  page: Page,
  query: string,
  options?: { limit?: number },
): Promise<WebUiCandidate[]> {
  const limit = options?.limit ?? 10;
  const out: WebUiCandidate[] = [];
  const seen = new Set<string>();

  const engines = [
    {
      url: `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
      evaluate: () => {
        const items: Array<{ href: string; text: string }> = [];
        const seenHref = new Set<string>();
        for (const a of document.querySelectorAll(
          '#results a[href], [data-type="web"] a[href], .snippet a[href], main a[href]',
        )) {
          const el = a as HTMLAnchorElement;
          if (!el.href || seenHref.has(el.href)) continue;
          if (/brave\.com/i.test(el.href)) continue;
          const text = (el.textContent || "").replace(/\s+/g, " ").trim();
          if (text.length < 12) continue;
          seenHref.add(el.href);
          items.push({ href: el.href, text: text.slice(0, 100) });
        }
        return items;
      },
    },
    {
      url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      evaluate: () => {
        const items: Array<{ href: string; text: string }> = [];
        for (const a of document.querySelectorAll(
          "#b_results h2 a, .b_algo h2 a",
        )) {
          const el = a as HTMLAnchorElement;
          if (!el.href || /bing\.com|microsoft\.com/i.test(el.href)) continue;
          items.push({
            href: el.href,
            text: (el.textContent || "").trim().slice(0, 100),
          });
        }
        return items;
      },
    },
  ] as const;

  for (const engine of engines) {
    if (out.length >= limit) break;
    try {
      await softGoto(page, engine.url, 2500);
      const hits = await page.evaluate(engine.evaluate);
      for (const hit of hits) {
        if (out.length >= limit) break;
        const hay = `${hit.text} ${hit.href}`;
        if (!UI_LINK_RE.test(hay) && !/salesforce|lightning|slds|crm/i.test(hay))
          continue;
        pushUnique(out, seen, {
          url: hit.href,
          label: hit.text || "Web search result",
          via: "web-search",
          kind: /design|component|slds|blueprint/i.test(hay)
            ? "component"
            : /demo|product|sales|service|crm/i.test(hay)
              ? "product"
              : "docs",
        });
      }
    } catch {
      /* engine blocked / timed out — continue */
    }
  }

  return out;
}

/** YouTube search → watch URLs for demo frame fallbacks. */
export async function searchYoutubeDemos(
  page: Page,
  query: string,
  options?: { limit?: number },
): Promise<WebUiCandidate[]> {
  const limit = options?.limit ?? 6;
  const out: WebUiCandidate[] = [];
  const seen = new Set<string>();

  try {
    await softGoto(
      page,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      2800,
    );
  } catch {
    return out;
  }

  const hits = await page.evaluate(() => {
    const items: Array<{ href: string; text: string }> = [];
    const seenId = new Set<string>();
    for (const a of document.querySelectorAll('a[href*="/watch?v="]')) {
      const el = a as HTMLAnchorElement;
      try {
        const id = new URL(el.href).searchParams.get("v");
        if (!id || seenId.has(id)) continue;
        seenId.add(id);
        items.push({
          href: `https://www.youtube.com/watch?v=${id}`,
          text: (el.getAttribute("title") || el.textContent || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 100),
        });
      } catch {
        /* ignore */
      }
    }
    return items;
  });

  for (const hit of hits) {
    if (out.length >= limit) break;
    pushUnique(out, seen, {
      url: hit.href,
      label: hit.text || "YouTube demo",
      via: "youtube-search",
      kind: "video",
    });
  }

  return out;
}

/**
 * From a seed page, pull same-site links that look like features / UI / docs.
 */
export async function expandFromSeedPage(
  page: Page,
  seedUrl: string,
  options?: { limit?: number; sameHostOnly?: boolean },
): Promise<WebUiCandidate[]> {
  const limit = options?.limit ?? 8;
  const sameHostOnly = options?.sameHostOnly ?? true;
  const out: WebUiCandidate[] = [];
  const seen = new Set<string>();

  try {
    await softGoto(page, seedUrl, 1800);
  } catch {
    return out;
  }

  let seedHost = "";
  try {
    seedHost = new URL(seedUrl).hostname.replace(/^www\./, "");
  } catch {
    return out;
  }

  const links = await page.evaluate(() => {
    const items: Array<{ href: string; text: string }> = [];
    for (const a of document.querySelectorAll("a[href]")) {
      const el = a as HTMLAnchorElement;
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!text || text.length > 90) continue;
      items.push({ href: el.href, text });
    }
    return items;
  });

  for (const link of links) {
    if (out.length >= limit) break;
    try {
      const host = new URL(link.href).hostname.replace(/^www\./, "");
      if (sameHostOnly && host !== seedHost) continue;
    } catch {
      continue;
    }
    if (!UI_LINK_RE.test(`${link.text} ${link.href}`)) continue;
    pushUnique(out, seen, {
      url: link.href,
      label: link.text.slice(0, 80),
      via: "seed-expand",
      kind: /demo|product|feature|sales|service|crm|agentforce/i.test(
        `${link.text} ${link.href}`,
      )
        ? "product"
        : "docs",
    });
  }

  return out;
}

export type DiscoverWebUiOptions = {
  productName: string;
  slug: string;
  designSystemLabel?: string;
  /** Known-good design-system / docs roots to crawl first */
  designSystemRoots?: string[];
  /** Marketing / Trailhead / docs seeds to expand */
  seedUrls?: string[];
  limit?: number;
};

/**
 * Full discovery pass for a product — design systems, web search, YouTube, seeds.
 */
export async function discoverWebUiExamples(
  page: Page,
  options: DiscoverWebUiOptions,
): Promise<WebUiCandidate[]> {
  const limit = options.limit ?? 28;
  const out: WebUiCandidate[] = [];
  const seen = new Set<string>();

  const name = options.productName;
  const dsLabel = options.designSystemLabel?.trim();

  for (const root of options.designSystemRoots ?? []) {
    if (out.length >= limit) break;
    const harvested = await harvestDesignSystemLinks(page, root, {
      limit: 14,
    });
    for (const hit of harvested) {
      if (out.length >= limit) break;
      pushUnique(out, seen, hit);
    }
  }

  const searchQueries = [
    `${name} UI screenshot interface`,
    dsLabel
      ? `${dsLabel} components blueprints`
      : `${name} design system components`,
    `${name} features capabilities demo`,
  ];

  for (const query of searchQueries) {
    if (out.length >= limit) break;
    const hits = await searchWebUiExamples(page, query, { limit: 6 });
    for (const hit of hits) {
      if (out.length >= limit) break;
      pushUnique(out, seen, hit);
    }
  }

  if (out.filter((c) => c.via === "youtube-search").length < 3) {
    const yt = await searchYoutubeDemos(
      page,
      `${name} official product demo Lightning`,
      { limit: 5 },
    );
    for (const hit of yt) {
      if (out.length >= limit) break;
      pushUnique(out, seen, hit);
    }
  }

  for (const seed of (options.seedUrls ?? []).slice(0, 4)) {
    if (out.length >= limit) break;
    const expanded = await expandFromSeedPage(page, seed, { limit: 6 });
    for (const hit of expanded) {
      if (out.length >= limit) break;
      pushUnique(out, seen, hit);
    }
  }

  return out.slice(0, limit);
}

/** Prefer component + product surfaces over raw video URLs for live Playwright shots. */
export function captureableWebUiCandidates(
  candidates: WebUiCandidate[],
): WebUiCandidate[] {
  return candidates.filter((c) => c.kind !== "video");
}

export function youtubeUrlsFromCandidates(
  candidates: WebUiCandidate[],
): string[] {
  return candidates.filter((c) => c.kind === "video").map((c) => c.url);
}
