/**
 * Design-system URL discovery for ProductBench capture.
 *
 * Homepages are often bot-blocked; public design systems, Storybooks, and
 * component docs are usually open and rich in UI/UX detail. This module
 * resolves candidates from:
 *   1. Curated visual-sources.designSystem URLs
 *   2. Known design-system registry (by slug + name match)
 *   3. Path guesses on the product origin
 *   4. Optional HTML link scrape + lightweight web search
 */

import type { VisualSourceGroup } from "../../src/data/visual-sources";

export type DesignSystemCandidate = {
  url: string;
  label: string;
  /** How the URL was found */
  via: "curated" | "registry" | "path-guess" | "html-link" | "web-search";
};

/** Well-known public design-system / component docs keyed by product slug. */
export const DESIGN_SYSTEM_BY_SLUG: Record<string, DesignSystemCandidate[]> = {
  "shopify-admin": [
    {
      url: "https://polaris.shopify.com",
      label: "Shopify Polaris",
      via: "registry",
    },
    {
      url: "https://shopify.dev/docs/api/polaris",
      label: "Polaris web components",
      via: "registry",
    },
    {
      url: "https://github.com/Shopify/polaris",
      label: "Polaris GitHub",
      via: "registry",
    },
  ],
  salesforce: [
    {
      url: "https://www.lightningdesignsystem.com/2e1ef8501",
      label: "Lightning Design System 2 (SLDS)",
      via: "registry",
    },
    {
      url: "https://www.lightningdesignsystem.com/2e1ef8501/p/755aff-components",
      label: "SLDS Components",
      via: "registry",
    },
    {
      url: "https://www.lightningdesignsystem.com/2e1ef8501/p/86f13a-data-table",
      label: "SLDS Data Table",
      via: "registry",
    },
    {
      url: "https://www.lightningdesignsystem.com/2e1ef8501/p/01c12a-modals",
      label: "SLDS Modals",
      via: "registry",
    },
    {
      url: "https://www.lightningdesignsystem.com/2e1ef8501/p/7733f8-button",
      label: "SLDS Buttons",
      via: "registry",
    },
    {
      url: "https://github.com/salesforce-ux/design-system",
      label: "SLDS GitHub",
      via: "registry",
    },
  ],
  vercel: [
    {
      url: "https://vercel.com/geist/introduction",
      label: "Geist design system",
      via: "registry",
    },
    {
      url: "https://vercel.com/geist/button",
      label: "Geist components",
      via: "registry",
    },
    {
      url: "https://github.com/vercel/geist-font",
      label: "Geist font GitHub",
      via: "registry",
    },
  ],
  github: [
    {
      url: "https://primer.style",
      label: "Primer design system",
      via: "registry",
    },
    {
      url: "https://primer.style/product",
      label: "Primer product",
      via: "registry",
    },
    {
      url: "https://github.com/primer/design",
      label: "Primer GitHub",
      via: "registry",
    },
  ],
  "sap-s4hana": [
    {
      url: "https://experience.sap.com/fiori-design/",
      label: "SAP Fiori design",
      via: "registry",
    },
    {
      url: "https://sapui5.hana.ondemand.com/",
      label: "SAPUI5 / Fiori",
      via: "registry",
    },
    {
      url: "https://www.sap.com/design-system",
      label: "SAP design system",
      via: "registry",
    },
  ],
  spotify: [
    {
      url: "https://developer.spotify.com/documentation/design",
      label: "Spotify design docs",
      via: "registry",
    },
    {
      url: "https://github.com/spotify/web-scripts",
      label: "Spotify web tooling",
      via: "registry",
    },
  ],
  okta: [
    {
      url: "https://odyssey.okta.design",
      label: "Okta Odyssey",
      via: "registry",
    },
    {
      url: "https://github.com/okta/odyssey",
      label: "Odyssey GitHub",
      via: "registry",
    },
  ],
  intercom: [
    {
      url: "https://www.intercom.com/help/en/articles/6589680-getting-started-with-intercom",
      label: "Intercom product UI docs",
      via: "registry",
    },
  ],
  "stripe-dashboard": [
    {
      url: "https://stripe.com/docs/stripe-js/elements",
      label: "Stripe Elements",
      via: "registry",
    },
    {
      url: "https://docs.stripe.com/payments/checkout",
      label: "Stripe Checkout UI",
      via: "registry",
    },
  ],
  ibm: [
    {
      url: "https://carbondesignsystem.com",
      label: "Carbon Design System",
      via: "registry",
    },
    {
      url: "https://github.com/carbon-design-system/carbon",
      label: "Carbon GitHub",
      via: "registry",
    },
  ],
  adobe: [
    {
      url: "https://spectrum.adobe.com",
      label: "Adobe Spectrum",
      via: "registry",
    },
    {
      url: "https://github.com/adobe/spectrum-css",
      label: "Spectrum CSS GitHub",
      via: "registry",
    },
  ],
  atlassian: [
    {
      url: "https://atlassian.design",
      label: "Atlassian Design System",
      via: "registry",
    },
    {
      url: "https://atlassian.design/components",
      label: "Atlassian components",
      via: "registry",
    },
  ],
  jira: [
    {
      url: "https://atlassian.design",
      label: "Atlassian Design System",
      via: "registry",
    },
    {
      url: "https://atlassian.design/components",
      label: "Atlassian components",
      via: "registry",
    },
  ],
  confluence: [
    {
      url: "https://atlassian.design",
      label: "Atlassian Design System",
      via: "registry",
    },
  ],
  microsoft: [
    {
      url: "https://fluent2.microsoft.design",
      label: "Fluent 2",
      via: "registry",
    },
    {
      url: "https://developer.microsoft.com/en-us/fluentui",
      label: "Fluent UI",
      via: "registry",
    },
  ],
  twilio: [
    {
      url: "https://paste.twilio.design",
      label: "Twilio Paste",
      via: "registry",
    },
    {
      url: "https://github.com/twilio-labs/paste",
      label: "Paste GitHub",
      via: "registry",
    },
  ],
  gitlab: [
    {
      url: "https://design.gitlab.com",
      label: "Pajamas Design System",
      via: "registry",
    },
    {
      url: "https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com",
      label: "Pajamas source",
      via: "registry",
    },
  ],
  slack: [
    {
      url: "https://docs.slack.dev/block-kit",
      label: "Slack Block Kit",
      via: "registry",
    },
  ],
  servicenow: [
    {
      url: "https://www.servicenow.com/docs/bundle/yokohama-platform-user-interface/page/administer/navigation-and-ui/concept/c_UIFramework.html",
      label: "ServiceNow UI framework",
      via: "registry",
    },
  ],
  airtable: [
    {
      url: "https://airtable.com/developers/web/guides/interface-designer",
      label: "Airtable Interface Designer",
      via: "registry",
    },
  ],
  figma: [
    {
      url: "https://www.figma.com/design-systems/",
      label: "Figma design systems",
      via: "registry",
    },
    {
      url: "https://www.figma.com/community",
      label: "Figma Community",
      via: "registry",
    },
  ],
  linear: [
    {
      url: "https://linear.app/docs",
      label: "Linear docs (UI patterns)",
      via: "registry",
    },
  ],
  notion: [
    {
      url: "https://www.notion.com/help/guides",
      label: "Notion guides (UI patterns)",
      via: "registry",
    },
  ],
};

/**
 * Match free-text designSystem labels (from product.ux) to known public sites.
 * Keys are lowercase substrings checked against the label.
 */
const DESIGN_SYSTEM_BY_NAME: Array<{
  match: RegExp;
  urls: Array<{ url: string; label: string }>;
}> = [
  {
    match: /polaris/i,
    urls: [
      { url: "https://polaris.shopify.com", label: "Shopify Polaris" },
      { url: "https://shopify.dev/docs/api/polaris", label: "Polaris docs" },
    ],
  },
  {
    match: /lightning|slds/i,
    urls: [
      {
        url: "https://www.lightningdesignsystem.com/2e1ef8501",
        label: "Lightning Design System 2",
      },
      {
        url: "https://www.lightningdesignsystem.com/2e1ef8501/p/755aff-components",
        label: "SLDS Components",
      },
    ],
  },
  {
    match: /geist/i,
    urls: [{ url: "https://vercel.com/geist/introduction", label: "Geist" }],
  },
  {
    match: /primer/i,
    urls: [{ url: "https://primer.style", label: "Primer" }],
  },
  {
    match: /fiori/i,
    urls: [
      { url: "https://experience.sap.com/fiori-design/", label: "SAP Fiori" },
      { url: "https://sapui5.hana.ondemand.com/", label: "SAPUI5" },
    ],
  },
  {
    match: /encore/i,
    urls: [
      {
        url: "https://developer.spotify.com/documentation/design",
        label: "Spotify design",
      },
    ],
  },
  {
    match: /odyssey/i,
    urls: [
      { url: "https://odyssey.okta.design", label: "Okta Odyssey" },
      { url: "https://github.com/okta/odyssey", label: "Odyssey GitHub" },
    ],
  },
  {
    match: /\bcarbon\b/i,
    urls: [{ url: "https://carbondesignsystem.com", label: "Carbon" }],
  },
  {
    match: /spectrum/i,
    urls: [{ url: "https://spectrum.adobe.com", label: "Adobe Spectrum" }],
  },
  {
    match: /fluent/i,
    urls: [
      { url: "https://fluent2.microsoft.design", label: "Fluent 2" },
      {
        url: "https://developer.microsoft.com/en-us/fluentui",
        label: "Fluent UI",
      },
    ],
  },
  {
    match: /\bpaste\b/i,
    urls: [{ url: "https://paste.twilio.design", label: "Twilio Paste" }],
  },
  {
    match: /pajamas/i,
    urls: [{ url: "https://design.gitlab.com", label: "GitLab Pajamas" }],
  },
  {
    match: /atlassian\s*design/i,
    urls: [{ url: "https://atlassian.design", label: "Atlassian Design" }],
  },
  {
    match: /material\s*(?:design|ui)|mui/i,
    urls: [
      { url: "https://m3.material.io", label: "Material Design 3" },
      { url: "https://mui.com", label: "MUI" },
    ],
  },
  {
    match: /ant\s*design|antd/i,
    urls: [{ url: "https://ant.design", label: "Ant Design" }],
  },
  {
    match: /chakra/i,
    urls: [{ url: "https://chakra-ui.com", label: "Chakra UI" }],
  },
  {
    match: /shadcn/i,
    urls: [{ url: "https://ui.shadcn.com", label: "shadcn/ui" }],
  },
];

const DESIGN_SYSTEM_PATHS = [
  "/design",
  "/design-system",
  "/designsystem",
  "/brand",
  "/branding",
  "/style",
  "/styleguide",
  "/style-guide",
  "/ui",
  "/components",
  "/patterns",
  "/foundations",
  "/tokens",
  "/storybook",
];

const DS_LINK_RE =
  /design[\s-]?system|storybook|component\s+library|style\s*guide|design\s*tokens|foundations|ui\s*kit|brand\s*guidelines|primer|polaris|spectrum|carbon|geist|odyssey|fiori|fluent|pajamas|encore/i;

const DS_CONTENT_RE =
  /design\s*system|components?|tokens?|foundations?|storybook|typography|color\s*palette|spacing|elevation|accessibility|patterns?/i;

function normalizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    u.hash = "";
    // Drop trailing slash except origin root
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return null;
  }
}

function pushUnique(
  out: DesignSystemCandidate[],
  seen: Set<string>,
  candidate: DesignSystemCandidate,
) {
  const normalized = normalizeUrl(candidate.url);
  if (!normalized || seen.has(normalized)) return;
  seen.add(normalized);
  out.push({ ...candidate, url: normalized });
}

function originOf(website: string): string | null {
  try {
    return new URL(website).origin;
  } catch {
    return null;
  }
}

/** Sync resolution — curated + registry + name match + path guesses (no network). */
export function resolveDesignSystemCandidates(options: {
  slug: string;
  website: string;
  designSystemLabel?: string;
  sources?: VisualSourceGroup;
}): DesignSystemCandidate[] {
  const { slug, website, designSystemLabel, sources } = options;
  const out: DesignSystemCandidate[] = [];
  const seen = new Set<string>();

  for (const url of sources?.designSystem ?? []) {
    let label = "Curated design system";
    try {
      label = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* keep default */
    }
    pushUnique(out, seen, {
      url,
      label,
      via: "curated",
    });
  }

  for (const candidate of DESIGN_SYSTEM_BY_SLUG[slug] ?? []) {
    pushUnique(out, seen, candidate);
  }

  if (designSystemLabel) {
    for (const entry of DESIGN_SYSTEM_BY_NAME) {
      if (!entry.match.test(designSystemLabel)) continue;
      for (const hit of entry.urls) {
        pushUnique(out, seen, {
          url: hit.url,
          label: hit.label,
          via: "registry",
        });
      }
    }
  }

  const origin = originOf(sources?.homepage ?? website);
  if (origin) {
    for (const path of DESIGN_SYSTEM_PATHS) {
      pushUnique(out, seen, {
        url: `${origin}${path}`,
        label: `Guessed ${path}`,
        via: "path-guess",
      });
    }
    // Common Storybook / docs subdomains
    try {
      const host = new URL(origin).hostname.replace(/^www\./, "");
      for (const sub of ["design", "storybook", "ui", "brand", "docs"]) {
        pushUnique(out, seen, {
          url: `https://${sub}.${host}`,
          label: `${sub}.${host}`,
          via: "path-guess",
        });
      }
    } catch {
      /* ignore */
    }
  }

  return out;
}

async function fetchHtmlSoft(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "ProductBenchResearchBot/0.4 (+local research; design-system discovery)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    return html;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractDesignSystemLinks(
  html: string,
  pageUrl: string,
): DesignSystemCandidate[] {
  const found: DesignSystemCandidate[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const href = match[1];
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    let abs: string;
    try {
      abs = new URL(href, pageUrl).toString();
    } catch {
      continue;
    }
    const tag = match[0];
    const text = tag.replace(/<[^>]+>/g, " ");
    const hay = `${href} ${text}`.toLowerCase();
    if (!DS_LINK_RE.test(hay)) continue;
    pushUnique(found, seen, {
      url: abs,
      label: text.replace(/\s+/g, " ").trim().slice(0, 80) || "Design system link",
      via: "html-link",
    });
    if (found.length >= 8) break;
  }

  return found;
}

/**
 * Probe path guesses + scrape homepage/docs for design-system links.
 * Drop candidates that 404 / bot-wall / lack DS-ish content (except curated/registry).
 */
export async function discoverDesignSystemSources(options: {
  slug: string;
  website: string;
  designSystemLabel?: string;
  sources?: VisualSourceGroup;
  /** Max live URLs to keep after probing */
  limit?: number;
}): Promise<DesignSystemCandidate[]> {
  const limit = options.limit ?? 10;
  const base = resolveDesignSystemCandidates(options);
  const homepage = options.sources?.homepage ?? options.website;

  // Scrape homepage (and first curated help/docs page) for DS links
  const scrapeTargets = [
    homepage,
    ...(options.sources?.help ?? []).slice(0, 1),
    ...(options.sources?.technical ?? []).slice(0, 1),
  ].filter(Boolean);

  const fromHtml: DesignSystemCandidate[] = [];
  const seen = new Set(base.map((c) => normalizeUrl(c.url)).filter(Boolean) as string[]);

  for (const target of scrapeTargets) {
    const html = await fetchHtmlSoft(target);
    if (!html) continue;
    for (const link of extractDesignSystemLinks(html, target)) {
      pushUnique(fromHtml, seen, link);
    }
  }

  // Lightweight DuckDuckGo HTML search when we have almost nothing solid
  const solid = base.filter((c) => c.via === "curated" || c.via === "registry");
  if (solid.length < 2) {
    const query = options.designSystemLabel?.trim()
      ? `${options.designSystemLabel} design system`
      : `${options.slug} design system components`;
    const searchHits = await searchDesignSystemUrls(query, options.slug);
    for (const hit of searchHits) {
      pushUnique(fromHtml, seen, hit);
    }
  }

  const combined = [...base, ...fromHtml];
  const kept: DesignSystemCandidate[] = [];

  for (const candidate of combined) {
    if (kept.length >= limit) break;

    // Always keep curated + registry without probing (known-good)
    if (candidate.via === "curated" || candidate.via === "registry") {
      kept.push(candidate);
      continue;
    }

    // Probe path guesses / html / search — keep only reachable DS-ish pages
    const html = await fetchHtmlSoft(candidate.url);
    if (!html) continue;
    const sample = html.slice(0, 8000);
    if (
      /just a moment|attention required|access denied|cf-browser-verification|captcha|are you a robot/i.test(
        sample,
      )
    ) {
      continue;
    }
    if (!DS_CONTENT_RE.test(sample) && candidate.via === "path-guess") {
      continue;
    }
    kept.push(candidate);
  }

  return kept.slice(0, limit);
}

async function searchDesignSystemUrls(
  query: string,
  slug: string,
): Promise<DesignSystemCandidate[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await fetchHtmlSoft(url);
  if (!html) return [];

  const hits: DesignSystemCandidate[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(
    /uddg=([^&"]+)|class="result__a"[^>]*href="([^"]+)"/gi,
  )) {
    let raw = match[1] ? decodeURIComponent(match[1]) : match[2];
    if (!raw) continue;
    if (raw.includes("duckduckgo.com")) continue;
    try {
      raw = decodeURIComponent(raw);
    } catch {
      /* keep raw */
    }
    const normalized = normalizeUrl(raw);
    if (!normalized || !/^https?:\/\//i.test(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const hay = normalized.toLowerCase();
    // Prefer DS-ish hosts / paths; skip pure marketing homepages without DS signal
    const looksUseful =
      DS_LINK_RE.test(hay) ||
      /github\.com|storybook|design\.|\/design|\/components|\/tokens|primer|polaris|spectrum|carbon|geist|fiori|fluent|odyssey/.test(
        hay,
      );
    if (!looksUseful) continue;

    hits.push({
      url: normalized,
      label: `Search: ${slug} design system`,
      via: "web-search",
    });
    if (hits.length >= 5) break;
  }

  return hits;
}

/** Flat URL list for playbooks / fallback. */
export function designSystemUrls(
  candidates: DesignSystemCandidate[],
): string[] {
  return candidates.map((c) => c.url);
}
