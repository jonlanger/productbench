/**
 * Web fallbacks when Playwright live capture is thin or bot-blocked.
 *
 * Primary chain:
 *   1. Design-system / Storybook / component docs (curated + discovered)
 *   2. Curated docs/help/technical pages (PRODUCT_VISUAL_SOURCES) → download UI images
 *   3. Open Graph / Twitter meta images from homepage
 *   4. thum.io live snapshot of homepage
 *   5. Apple App Store public screenshots (when appStoreId is curated; reserved slots)
 *   6. Wayback Machine archived page images / snapshot
 *   7. YouTube thumbnails + auto frame stills (0–3.jpg)
 */

import { createWriteStream, mkdirSync } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

import type { ProductScreenshotKind } from "../../src/data/types";
import {
  flattenVisualSources,
  PRODUCT_VISUAL_SOURCES,
  type VisualSourceGroup,
} from "../../src/data/visual-sources";
import {
  discoverDesignSystemSources,
  resolveDesignSystemCandidates,
  type DesignSystemCandidate,
} from "./design-system-sources";

export type FallbackShot = {
  file: string;
  title: string;
  caption: string;
  kind: ProductScreenshotKind;
  sourceUrl: string;
};

const BLOCKED_RE =
  /just a moment|attention required|checking your browser|verify you are (?:a )?human|access denied|cf-browser-verification|challenge-platform|enable javascript and cookies|bot detection|pardon our interruption|are you a robot|captcha|ddos-guard|please wait while we (?:verify|check)|unusual traffic|request unsuccessful/i;

const UI_HINT_RE =
  /screenshot|screen[-_]?shot|product[-_]?ui|dashboard|interface|canvas|editor|workspace|board|kanban|timeline|inbox|composer|modal|dialog|settings|admin|console|workflow|pipeline|component|token|typography|color|palette|icon|button|form|card|\/docs\/.*\.(png|jpe?g|webp)|webassets\.linear\.app|cdn\.sanity\.io|files\.readme\.io|ctfassets\.net|mintcdn\.com|storybook|design[-_]?system/i;

const REJECT_RE =
  /logo|wordmark|favicon|sprite|emoji|avatar|\/icons?\/|badge|spinner|loader|placeholder|1x1|pixel|tracking|spacer|og[-_]?image|opengraph|twitter[-_]?card|social[-_]?share|apple[-_]?touch/i;

const MIN_LIVE_SHOTS = 14;
/** Soft gallery target — fallback tops up toward this when curated media exists */
const GALLERY_TARGET = 120;
const MAX_FALLBACK_SHOTS = 48;

export function looksBlockedText(text: string) {
  return BLOCKED_RE.test(text);
}

function hasCuratedMedia(slug: string) {
  const sources = PRODUCT_VISUAL_SOURCES[slug];
  const hasRegistryDs = resolveDesignSystemCandidates({
    slug,
    website: sources?.homepage ?? "https://example.com",
    sources,
  }).some((c) => c.via === "registry" || c.via === "curated");

  if (!sources) return hasRegistryDs;

  return Boolean(
    sources.youtube?.length ||
      sources.appStoreId ||
      sources.appStoreIds?.length ||
      sources.help?.length ||
      sources.technical?.length ||
      sources.supporting?.length ||
      sources.releases?.length ||
      sources.designSystem?.length ||
      hasRegistryDs,
  );
}

export function needsWebFallback(
  liveShotCount: number,
  blockedNavigations: number,
  slug?: string,
) {
  if (blockedNavigations >= 3) return true;
  if (liveShotCount < MIN_LIVE_SHOTS) return true;
  // Always top up when curated YouTube / App Store / docs media exists —
  // deep live playbooks still miss mobile store shots and video frames.
  if (slug && hasCuratedMedia(slug)) return true;
  if (slug && liveShotCount < GALLERY_TARGET && hasCuratedMedia(slug)) return true;
  return false;
}

function absolutize(base: string, value: string | undefined | null) {
  if (!value) return null;
  try {
    return new URL(value.replace(/&amp;/g, "&"), base).toString();
  } catch {
    return null;
  }
}

function youtubeIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "").slice(0, 11);
      return id.length === 11 ? id : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && v.length === 11) return v;
      const embed = u.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
      if (embed) return embed[1]!;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "ProductBenchResearchBot/0.4 (+local research; visual fallback)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    if (looksBlockedText(html.slice(0, 4000))) {
      throw new Error("bot wall / challenge page");
    }
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadToJpeg(
  src: string,
  dir: string,
  basename: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(src, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "ProductBenchResearchBot/0.4 (+local research; image download)",
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    if (!response.ok || !response.body) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.startsWith("image/")) return null;

    mkdirSync(dir, { recursive: true });
    const ext = /\.jpe?g(\?|$)/i.test(src)
      ? "jpg"
      : /\.webp(\?|$)/i.test(src)
        ? "webp"
        : /\.png(\?|$)/i.test(src)
          ? "png"
          : contentType.includes("jpeg")
            ? "jpg"
            : contentType.includes("webp")
              ? "webp"
              : "png";
    const rawPath = join(dir, `${basename}.${ext}`);
    const nodeStream = Readable.fromWeb(
      response.body as import("stream/web").ReadableStream,
    );
    await pipeline(nodeStream, createWriteStream(rawPath));

    if (ext === "jpg") return `${basename}.jpg`;

    const jpgPath = join(dir, `${basename}.jpg`);
    try {
      const { execSync } = await import("child_process");
      execSync(
        `sips -s format jpeg -s formatOptions 82 "${rawPath}" --out "${jpgPath}"`,
        { stdio: "ignore" },
      );
      const { unlinkSync } = await import("fs");
      unlinkSync(rawPath);
      return `${basename}.jpg`;
    } catch {
      return `${basename}.${ext}`;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractDocImages(html: string, pageUrl: string) {
  const found: Array<{ src: string; alt: string; score: number }> = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const srcMatch =
      tag.match(/(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i) ??
      tag.match(/srcset=["']([^"'\s]+)/i);
    if (!srcMatch) continue;
    const src = absolutize(pageUrl, srcMatch[1]);
    if (!src || seen.has(src)) continue;
    if (!/^https?:\/\//i.test(src)) continue;
    const alt = tag.match(/alt=["']([^"']*)["']/i)?.[1] ?? "";
    const hay = `${src} ${alt}`.toLowerCase();
    if (REJECT_RE.test(hay)) continue;

    let score = 0;
    if (UI_HINT_RE.test(hay)) score += 8;
    if (/\.(png|jpe?g|webp)(\?|$)/i.test(src)) score += 1;
    if (/screenshot|dashboard|product ui|workspace/i.test(alt)) score += 5;
    if (score < 4) continue;

    seen.add(src);
    found.push({ src, alt, score });
  }

  return found.sort((a, b) => b.score - a.score);
}

function extractMetaImages(html: string, pageUrl: string) {
  const images: Array<{ src: string; title: string; caption: string }> = [];
  const seen = new Set<string>();

  function push(src: string | null, title: string, caption: string) {
    if (!src || seen.has(src)) return;
    if (!/^https?:\/\//i.test(src)) return;
    seen.add(src);
    images.push({ src, title, caption });
  }

  const patterns: Array<{ re: RegExp; title: string; caption: string }> = [
    {
      re: /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
      title: "Marketing preview",
      caption: "Open Graph image (fallback when live UI capture was thin)",
    },
    {
      re: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/gi,
      title: "Marketing preview",
      caption: "Open Graph image (fallback when live UI capture was thin)",
    },
    {
      re: /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
      title: "Social preview",
      caption: "Twitter/X card image (fallback)",
    },
    {
      re: /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/gi,
      title: "Social preview",
      caption: "Twitter/X card image (fallback)",
    },
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern.re)) {
      push(absolutize(pageUrl, match[1]), pattern.title, pattern.caption);
    }
  }
  return images;
}

function sourceKind(
  sources: VisualSourceGroup | undefined,
  docUrl: string,
): ProductScreenshotKind {
  if (sources?.designSystem?.includes(docUrl)) return "component";
  if (sources?.technical?.includes(docUrl)) return "technical";
  if (sources?.supporting?.includes(docUrl)) return "supporting";
  if (sources?.releases?.includes(docUrl)) return "docs";
  return "docs";
}

async function collectFromDesignSystems(
  options: {
    slug: string;
    website: string;
    designSystemLabel?: string;
    sources?: VisualSourceGroup;
  },
  dir: string,
  budget: number,
): Promise<FallbackShot[]> {
  if (budget <= 0) return [];

  let candidates: DesignSystemCandidate[] = [];
  try {
    candidates = await discoverDesignSystemSources({
      ...options,
      limit: 8,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`    design-system discovery miss: ${message.slice(0, 80)}`);
    candidates = resolveDesignSystemCandidates(options).filter(
      (c) => c.via === "curated" || c.via === "registry",
    );
  }

  if (!candidates.length) return [];

  const shots: FallbackShot[] = [];
  let index = 0;

  for (const candidate of candidates) {
    if (shots.length >= budget) break;
    try {
      const html = await fetchHtml(candidate.url);
      // Design-system pages: accept lower UI-hint threshold — component galleries
      // often use generic img alts but still show real UI.
      const candidatesImgs = extractDocImages(html, candidate.url);
      const relaxed = candidatesImgs.length
        ? candidatesImgs
        : extractDocImagesRelaxed(html, candidate.url);
      let addedFromPage = 0;
      for (const img of relaxed.slice(0, 5)) {
        if (shots.length >= budget) break;
        index += 1;
        const file = await downloadToJpeg(
          img.src,
          dir,
          `fallback-ds-${index}`,
        );
        if (!file) continue;
        shots.push({
          file,
          title: (img.alt || `${candidate.label} ${index}`).slice(0, 90),
          caption: `Design system fallback (${candidate.via}): ${candidate.url}`,
          kind: "component",
          sourceUrl: candidate.url,
        });
        addedFromPage += 1;
      }

      // No downloadable images on this page — snapshot the live DS surface
      if (addedFromPage === 0 && shots.length < budget) {
        const snapshot = `https://image.thum.io/get/width/1400/noanimate/${encodeURIComponent(candidate.url)}`;
        index += 1;
        const file = await downloadToJpeg(
          snapshot,
          dir,
          `fallback-ds-thum-${index}`,
        );
        if (file) {
          shots.push({
            file,
            title: candidate.label,
            caption: `Design system page snapshot (${candidate.via}): ${candidate.url}`,
            kind: "component",
            sourceUrl: candidate.url,
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `    design-system miss ${candidate.url}: ${message.slice(0, 80)}`,
      );
    }
  }

  return shots;
}

/** Looser image extraction for design-system / Storybook pages. */
function extractDocImagesRelaxed(html: string, pageUrl: string) {
  const found: Array<{ src: string; alt: string; score: number }> = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const srcMatch =
      tag.match(/(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i) ??
      tag.match(/srcset=["']([^"'\s]+)/i);
    if (!srcMatch) continue;
    const src = absolutize(pageUrl, srcMatch[1]);
    if (!src || seen.has(src)) continue;
    if (!/^https?:\/\//i.test(src)) continue;
    const alt = tag.match(/alt=["']([^"']*)["']/i)?.[1] ?? "";
    const hay = `${src} ${alt}`.toLowerCase();
    if (REJECT_RE.test(hay)) continue;
    // Skip tiny tracking pixels by URL pattern only; size unknown here
    if (/1x1|pixel|spacer|blank\.(gif|png)/i.test(hay)) continue;

    let score = 2;
    if (/\.(png|jpe?g|webp|svg)(\?|$)/i.test(src)) score += 1;
    if (/component|button|modal|form|icon|illustration|example|preview/i.test(hay))
      score += 4;
    if (score < 3) continue;

    seen.add(src);
    found.push({ src, alt, score });
    if (found.length >= 12) break;
  }

  return found.sort((a, b) => b.score - a.score);
}

async function collectFromVisualSources(
  slug: string,
  dir: string,
  budget: number,
): Promise<FallbackShot[]> {
  const sources = PRODUCT_VISUAL_SOURCES[slug];
  if (!sources) return [];

  const docs = flattenVisualSources(sources).slice(0, 10);
  const shots: FallbackShot[] = [];
  let index = 0;

  for (const docUrl of docs) {
    if (shots.length >= budget) break;
    try {
      const html = await fetchHtml(docUrl);
      const candidates = extractDocImages(html, docUrl).slice(0, 4);
      for (const candidate of candidates) {
        if (shots.length >= budget) break;
        index += 1;
        const file = await downloadToJpeg(
          candidate.src,
          dir,
          `fallback-docs-${index}`,
        );
        if (!file) continue;
        shots.push({
          file,
          title: (candidate.alt || `Docs UI ${index}`).slice(0, 90),
          caption: `Fallback from public docs: ${docUrl}`,
          kind: sourceKind(sources, docUrl),
          sourceUrl: docUrl,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`    docs miss ${docUrl}: ${message.slice(0, 80)}`);
    }
  }

  return shots;
}

async function collectFromMetaAndThum(
  homepageUrl: string,
  dir: string,
  budget: number,
): Promise<FallbackShot[]> {
  const shots: FallbackShot[] = [];
  let index = 0;

  try {
    const html = await fetchHtml(homepageUrl);
    for (const meta of extractMetaImages(html, homepageUrl).slice(0, budget)) {
      index += 1;
      const file = await downloadToJpeg(meta.src, dir, `fallback-og-${index}`);
      if (!file) continue;
      shots.push({
        file,
        title: meta.title,
        caption: meta.caption,
        kind: "marketing",
        sourceUrl: homepageUrl,
      });
      if (shots.length >= budget) return shots;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`    og miss: ${message.slice(0, 80)}`);
  }

  if (shots.length === 0 && budget > 0) {
    const snapshot = `https://image.thum.io/get/width/1400/noanimate/${encodeURIComponent(homepageUrl)}`;
    const file = await downloadToJpeg(snapshot, dir, "fallback-thum-1");
    if (file) {
      shots.push({
        file,
        title: "Homepage snapshot",
        caption:
          "thum.io live snapshot (last-resort fallback when marketing assets were unavailable)",
        kind: "homepage",
        sourceUrl: homepageUrl,
      });
    }
  }

  return shots;
}

/** Pull images (and a thum snapshot) from the closest Wayback snapshot. */
async function collectFromWayback(
  homepageUrl: string,
  dir: string,
  budget: number,
): Promise<FallbackShot[]> {
  if (budget <= 0) return [];
  const shots: FallbackShot[] = [];

  try {
    const availability = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(homepageUrl)}`,
      {
        headers: {
          "user-agent": "ProductBenchResearchBot/0.4 (+local research; wayback)",
        },
      },
    );
    if (!availability.ok) return [];
    const data = (await availability.json()) as {
      archived_snapshots?: {
        closest?: { available?: boolean; url?: string; timestamp?: string };
      };
    };
    const closest = data.archived_snapshots?.closest;
    if (!closest?.available || !closest.url) return [];

    const archiveUrl = closest.url;
    let index = 0;

    try {
      const html = await fetchHtml(archiveUrl);
      const metas = extractMetaImages(html, archiveUrl).slice(0, 3);
      const docs = extractDocImages(html, archiveUrl).slice(0, 4);

      for (const meta of metas) {
        if (shots.length >= budget) break;
        index += 1;
        const src = meta.src.includes("web.archive.org")
          ? meta.src
          : `https://web.archive.org/web/${closest.timestamp}im_/${meta.src}`;
        const file = await downloadToJpeg(src, dir, `fallback-wayback-${index}`);
        if (!file) continue;
        shots.push({
          file,
          title: `Archived ${meta.title}`,
          caption: `Wayback Machine snapshot ${closest.timestamp} · ${homepageUrl}`,
          kind: "marketing",
          sourceUrl: archiveUrl,
        });
      }

      for (const candidate of docs) {
        if (shots.length >= budget) break;
        index += 1;
        const src = candidate.src.includes("web.archive.org")
          ? candidate.src
          : `https://web.archive.org/web/${closest.timestamp}im_/${candidate.src}`;
        const file = await downloadToJpeg(src, dir, `fallback-wayback-${index}`);
        if (!file) continue;
        shots.push({
          file,
          title: (candidate.alt || `Archived UI ${index}`).slice(0, 90),
          caption: `Wayback Machine UI asset · ${archiveUrl}`,
          kind: "docs",
          sourceUrl: archiveUrl,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`    wayback html miss: ${message.slice(0, 80)}`);
    }

    if (shots.length === 0) {
      const snapshot = `https://image.thum.io/get/width/1400/noanimate/${encodeURIComponent(archiveUrl)}`;
      const file = await downloadToJpeg(snapshot, dir, "fallback-wayback-thum");
      if (file) {
        shots.push({
          file,
          title: "Archived homepage",
          caption: `thum.io of Wayback snapshot ${closest.timestamp}`,
          kind: "homepage",
          sourceUrl: archiveUrl,
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`    wayback miss: ${message.slice(0, 80)}`);
  }

  return shots;
}

/**
 * YouTube stills without ffmpeg:
 * - maxresdefault / hqdefault poster
 * - 0–3.jpg auto-generated frame captures from the video
 */
async function collectFromYoutube(
  sources: VisualSourceGroup | undefined,
  dir: string,
  budget: number,
): Promise<FallbackShot[]> {
  const urls = sources?.youtube ?? [];
  if (!urls.length || budget <= 0) return [];

  const shots: FallbackShot[] = [];

  for (const url of urls) {
    if (shots.length >= budget) break;
    const id = youtubeIdFromUrl(url);
    if (!id) continue;

    const candidates = [
      { src: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, label: "poster" },
      { src: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, label: "poster-hq" },
      { src: `https://img.youtube.com/vi/${id}/0.jpg`, label: "frame-0" },
      { src: `https://img.youtube.com/vi/${id}/1.jpg`, label: "frame-1" },
      { src: `https://img.youtube.com/vi/${id}/2.jpg`, label: "frame-2" },
      { src: `https://img.youtube.com/vi/${id}/3.jpg`, label: "frame-3" },
    ];

    let gotPoster = false;
    for (const candidate of candidates) {
      if (shots.length >= budget) break;
      if (candidate.label.startsWith("poster") && gotPoster) continue;

      const file = await downloadToJpeg(
        candidate.src,
        dir,
        `fallback-yt-${id}-${candidate.label}`,
      );
      if (!file) continue;
      if (candidate.label.startsWith("poster")) gotPoster = true;

      shots.push({
        file,
        title: candidate.label.startsWith("frame")
          ? `YouTube frame still (${id})`
          : `YouTube poster (${id})`,
        caption: `YouTube ${candidate.label} · ${url}`,
        kind: "marketing",
        sourceUrl: url,
      });
    }
  }

  return shots;
}

function appStoreIdsFor(sources: VisualSourceGroup | undefined): string[] {
  if (!sources) return [];
  const ids = [
    ...(sources.appStoreId ? [sources.appStoreId] : []),
    ...(sources.appStoreIds ?? []),
  ];
  return [...new Set(ids)];
}

/**
 * When iTunes Lookup returns empty screenshotUrls (common for some apps),
 * scrape unique full-size mzstatic screenshot URLs from the public App Store page.
 */
async function scrapeAppStoreScreenshotUrls(
  appStoreId: string,
): Promise<string[]> {
  const pageUrl = `https://apps.apple.com/us/app/id${appStoreId}`;
  try {
    const response = await fetch(pageUrl, {
      headers: {
        "user-agent":
          "ProductBenchResearchBot/0.4 (+local research; appstore-page)",
        accept: "text/html",
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    const found = new Set<string>();
    // PurpleSource…/N.jpg/WxH… — keep the /N.jpg/ stem, request a large JPEG.
    const re =
      /https:\/\/is\d+-ssl\.mzstatic\.com\/image\/thumb\/PurpleSource[^"'\\\s]+?\/\d+\.jpg\//g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      found.add(`${match[0]}1200x0w.jpg`);
    }
    return [...found];
  } catch {
    return [];
  }
}

/** Public App Store screenshots via iTunes Lookup API (+ HTML scrape fallback). */
async function collectFromAppStore(
  sources: VisualSourceGroup | undefined,
  dir: string,
  budget: number,
): Promise<FallbackShot[]> {
  const ids = appStoreIdsFor(sources);
  if (!ids.length || budget <= 0) return [];

  const shots: FallbackShot[] = [];
  let index = 0;

  for (const appStoreId of ids) {
    if (shots.length >= budget) break;
    try {
      const response = await fetch(
        `https://itunes.apple.com/lookup?id=${encodeURIComponent(appStoreId)}`,
        {
          headers: {
            "user-agent":
              "ProductBenchResearchBot/0.4 (+local research; appstore)",
          },
        },
      );
      if (!response.ok) continue;
      const data = (await response.json()) as {
        results?: Array<{
          trackName?: string;
          screenshotUrls?: string[];
          ipadScreenshotUrls?: string[];
        }>;
      };
      const app = data.results?.[0];
      const trackName = app?.trackName ?? "App";

      let urls = [
        ...(app?.screenshotUrls ?? []),
        ...(app?.ipadScreenshotUrls ?? []),
      ];
      if (!urls.length) {
        urls = await scrapeAppStoreScreenshotUrls(appStoreId);
        if (urls.length) {
          console.log(
            `    app store ${appStoreId}: scraped ${urls.length} from product page (lookup empty)`,
          );
        }
      }
      if (!urls.length) continue;

      for (const src of urls) {
        if (shots.length >= budget) break;
        index += 1;
        const file = await downloadToJpeg(
          src,
          dir,
          `fallback-appstore-${appStoreId}-${index}`,
        );
        if (!file) continue;
        shots.push({
          file,
          title: `${trackName} screenshot ${index}`,
          caption: `Apple App Store public screenshot (id ${appStoreId})`,
          kind: "product",
          sourceUrl: `https://apps.apple.com/app/id${appStoreId}`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`    app store miss ${appStoreId}: ${message.slice(0, 80)}`);
    }
  }

  return shots;
}

/**
 * Run the primary web fallback chain and write files under public/products/[slug]/.
 */
export async function runWebFallback(options: {
  slug: string;
  website: string;
  dir: string;
  existingCount: number;
  designSystemLabel?: string;
}): Promise<FallbackShot[]> {
  const { slug, website, dir, existingCount, designSystemLabel } = options;
  // Prefer topping up toward GALLERY_TARGET; when already past it still pull
  // curated App Store / YouTube / docs images (budget = MAX_FALLBACK_SHOTS).
  const towardTarget = Math.max(0, GALLERY_TARGET - existingCount);
  const budget = Math.min(
    MAX_FALLBACK_SHOTS,
    towardTarget > 0 ? towardTarget : MAX_FALLBACK_SHOTS,
  );
  if (budget === 0) return [];

  const sources = PRODUCT_VISUAL_SOURCES[slug];
  const homepageUrl = sources?.homepage ?? website;
  const collected: FallbackShot[] = [];

  const remaining = () => budget - collected.length;

  console.log(`  fallback → design-system / Storybook (budget ${budget})…`);
  const ds = await collectFromDesignSystems(
    { slug, website, designSystemLabel, sources },
    dir,
    remaining(),
  );
  collected.push(...ds);
  console.log(`    +${ds.length} from design systems`);

  console.log(`  fallback → docs/help images…`);
  const docs = await collectFromVisualSources(slug, dir, remaining());
  collected.push(...docs);
  console.log(`    +${docs.length} from curated visual sources`);

  if (remaining() > 0) {
    console.log(`  fallback → OG/meta + thum.io…`);
    const meta = await collectFromMetaAndThum(homepageUrl, dir, remaining());
    collected.push(...meta);
    console.log(`    +${meta.length} from OG/thum`);
  }

  // App Store before Wayback/YouTube — first-party product UI beats archive/frames.
  // Carve up to 12 slots if docs/OG already filled the budget.
  if (appStoreIdsFor(sources).length > 0) {
    if (remaining() === 0 && collected.length >= 12) {
      const keep = Math.max(0, budget - 12);
      console.log(
        `  fallback → reserving App Store slots (trim ${collected.length - keep} earlier fallbacks)`,
      );
      collected.splice(keep);
    }
    if (remaining() > 0) {
      console.log(`  fallback → App Store screenshots…`);
      const store = await collectFromAppStore(
        sources,
        dir,
        Math.min(12, remaining()),
      );
      collected.push(...store);
      console.log(`    +${store.length} from App Store`);
    }
  }

  if (remaining() > 0) {
    console.log(`  fallback → Wayback Machine…`);
    const wayback = await collectFromWayback(homepageUrl, dir, remaining());
    collected.push(...wayback);
    console.log(`    +${wayback.length} from Wayback`);
  }

  if (remaining() > 0 && (sources?.youtube?.length ?? 0) > 0) {
    console.log(`  fallback → YouTube posters + frame stills…`);
    const yt = await collectFromYoutube(sources, dir, remaining());
    collected.push(...yt);
    console.log(`    +${yt.length} from YouTube`);
  }

  return collected;
}
