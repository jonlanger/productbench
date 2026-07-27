import type { Page } from "playwright";

import type {
  CapturePageInsight,
  Platform,
  ProductCaptureInsights,
} from "../../src/data/types";

function unique(values: string[], max = 40) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (!cleaned || cleaned.length < 2 || cleaned.length > 80) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= max) break;
  }
  return out;
}

const TECH_RULES: Array<{ re: RegExp; label: string }> = [
  { re: /react/i, label: "React" },
  { re: /next(\.js)?/i, label: "Next.js" },
  { re: /vue/i, label: "Vue" },
  { re: /angular/i, label: "Angular" },
  { re: /svelte/i, label: "Svelte" },
  { re: /webpack/i, label: "Webpack" },
  { re: /vite/i, label: "Vite" },
  { re: /tailwind/i, label: "Tailwind CSS" },
  { re: /graphql/i, label: "GraphQL" },
  { re: /stripe/i, label: "Stripe" },
  { re: /segment\.(com|io)|analytics\.js/i, label: "Segment" },
  { re: /googletagmanager|gtag\/js/i, label: "Google Tag Manager" },
  { re: /sentry/i, label: "Sentry" },
  { re: /datadog/i, label: "Datadog" },
  { re: /cloudflare/i, label: "Cloudflare" },
  { re: /contentful|ctfassets/i, label: "Contentful" },
  { re: /sanity/i, label: "Sanity" },
  { re: /shopify/i, label: "Shopify" },
  { re: /intercom/i, label: "Intercom" },
  { re: /zendesk/i, label: "Zendesk" },
  { re: /mapbox/i, label: "Mapbox" },
  { re: /google.*maps|maps\.googleapis/i, label: "Google Maps" },
];

const PATTERN_RULES: Array<{ re: RegExp; label: string }> = [
  { re: /dialog|modal/i, label: "Modal dialogs" },
  { re: /search/i, label: "Search" },
  { re: /filter/i, label: "Filters" },
  { re: /pricing|price/i, label: "Pricing display" },
  { re: /map/i, label: "Map view" },
  { re: /carousel|slider/i, label: "Carousels" },
  { re: /tab/i, label: "Tabs" },
  { re: /menu/i, label: "Menus" },
  { re: /card/i, label: "Card layout" },
  { re: /dashboard/i, label: "Dashboard" },
  { re: /inbox|message/i, label: "Messaging" },
  { re: /calendar/i, label: "Calendar" },
  { re: /checkout|cart/i, label: "Checkout" },
  { re: /sign in|log in|auth/i, label: "Authentication" },
];

export async function extractPageInsight(page: Page): Promise<CapturePageInsight> {
  // Keep this callback free of nested function declarations — tsx/esbuild
  // can inject __name helpers that break Playwright's page.evaluate serialization.
  const raw = await page.evaluate(() => {
    const meta =
      document.querySelector('meta[name="description"]')?.getAttribute("content") ||
      document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      "";

    const headings = [...document.querySelectorAll("h1, h2, h3")]
      .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 24);

    const navRoots = [
      ...document.querySelectorAll("nav, [role='navigation'], header"),
    ];
    const navLabels = navRoots
      .flatMap((root) =>
        [...root.querySelectorAll("a, button")].map((el) =>
          (el.textContent || "").replace(/\s+/g, " ").trim(),
        ),
      )
      .filter(Boolean)
      .slice(0, 40);

    const ctas = [...document.querySelectorAll("a[href], button, [role='button']")]
      .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
      .filter((label) =>
        /get started|sign up|log in|sign in|try|start|book|buy|pricing|demo|contact|download|continue|subscribe|join|explore|learn more|create|add|search|filter/i.test(
          label,
        ),
      )
      .slice(0, 30);

    const landmarks = [
      ...document.querySelectorAll(
        "header, nav, main, aside, footer, [role='dialog'], [role='search'], [role='navigation'], [role='main'], [role='banner'], [role='contentinfo']",
      ),
    ].map((el) => {
      const role = el.getAttribute("role") || el.tagName.toLowerCase();
      const name =
        el.getAttribute("aria-label") ||
        el.getAttribute("aria-labelledby") ||
        "";
      return name ? `${role}:${name}` : role;
    });

    return {
      url: location.href,
      title: document.title || "",
      description: meta,
      headings,
      navLabels,
      ctas,
      landmarks,
    };
  });

  return {
    url: raw.url,
    title: raw.title,
    description: raw.description || undefined,
    headings: unique(raw.headings, 20),
    navLabels: unique(raw.navLabels, 24),
    ctas: unique(raw.ctas, 20),
    landmarks: unique(raw.landmarks, 16),
  };
}

export function detectTechSignals(scriptAndClassBlob: string) {
  return unique(
    TECH_RULES.filter((rule) => rule.re.test(scriptAndClassBlob)).map(
      (rule) => rule.label,
    ),
    20,
  );
}

export function detectPatterns(blob: string) {
  return unique(
    PATTERN_RULES.filter((rule) => rule.re.test(blob)).map((rule) => rule.label),
    20,
  );
}

export function detectPlatforms(blob: string): Platform[] {
  const out: Platform[] = ["web"];
  if (/ios|app store|iphone|ipad/i.test(blob)) out.push("ios");
  if (/android|play store|google play/i.test(blob)) out.push("android");
  if (/desktop|mac app|windows app|electron/i.test(blob)) out.push("desktop");
  if (/api|developers?|graphql|sdk/i.test(blob)) out.push("api");
  if (/\bcli\b|command line|terminal/i.test(blob)) out.push("cli");
  return [...new Set(out)];
}

export async function extractRawSignals(page: Page) {
  return page.evaluate(() => {
    const scripts = [...document.querySelectorAll("script[src]")]
      .map((el) => el.getAttribute("src") || "")
      .join("\n");
    const classes = `${document.documentElement.className} ${document.body?.className || ""}`;
    const textSample = (document.body?.innerText || "").slice(0, 6000);
    return { scripts, classes, textSample };
  });
}

export function aggregateInsights(input: {
  pages: CapturePageInsight[];
  screenshotCount: number;
  techSignals: string[];
  patternCandidates: string[];
  platformsDetected: Platform[];
}): ProductCaptureInsights {
  const pages = input.pages.slice(0, 20);
  const navLabels = unique(pages.flatMap((p) => p.navLabels), 30);
  const ctas = unique(pages.flatMap((p) => p.ctas), 24);
  const headings = unique(pages.flatMap((p) => p.headings), 30);

  const featureCandidates = unique(
    [
      ...headings.filter((h) => h.length > 3 && h.length < 48),
      ...ctas.filter((c) => !/log in|sign in|sign up|cookie|accept|close/i.test(c)),
    ],
    24,
  );

  const pageCount = new Set(pages.map((p) => p.url.split("?")[0])).size;
  const summary = [
    `Captured ${input.screenshotCount} screenshots across ${pageCount} public URLs.`,
    navLabels.length ? `Nav signals: ${navLabels.slice(0, 6).join(", ")}.` : "",
    input.techSignals.length
      ? `Tech signals: ${input.techSignals.slice(0, 6).join(", ")}.`
      : "",
    input.patternCandidates.length
      ? `UI patterns: ${input.patternCandidates.slice(0, 6).join(", ")}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    capturedAt: new Date().toISOString(),
    screenshotCount: input.screenshotCount,
    pageCount,
    pages,
    navLabels,
    ctas,
    headings,
    techSignals: unique(input.techSignals, 20),
    featureCandidates,
    patternCandidates: unique(input.patternCandidates, 20),
    platformsDetected: input.platformsDetected,
    summary,
  };
}
