import type { ProductScreenshot, ProductScreenshotKind } from "@/data/types";

/**
 * Curated screen taxonomy for product detail “Screens” tab.
 * Not every product will have every category — empty ones are omitted.
 */
export const SCREEN_CATEGORIES = [
  {
    id: "homepage",
    title: "Homepage & landing",
    description:
      "Public entry points — heroes, landing pages, and scrolled homepage depth.",
  },
  {
    id: "marketing",
    title: "Marketing & pricing",
    description:
      "Campaign pages, product marketing, pricing, and promotional surfaces.",
  },
  {
    id: "auth",
    title: "Auth & onboarding",
    description:
      "Sign-in, sign-up, invite, and first-run flows (pattern captures only).",
  },
  {
    id: "navigation",
    title: "Navigation & shell",
    description:
      "App chrome — sidebars, top bars, menus, and primary wayfinding.",
  },
  {
    id: "search",
    title: "Search & discovery",
    description:
      "Search, filters, composers, browse, and result surfaces.",
  },
  {
    id: "dashboard",
    title: "Dashboards & overview",
    description:
      "Home dashboards, summaries, and at-a-glance status surfaces.",
  },
  {
    id: "workspace",
    title: "Workspace & editors",
    description:
      "Core product canvases — editors, detail pages, and primary work surfaces.",
  },
  {
    id: "collections",
    title: "Lists, tables & boards",
    description:
      "Multi-item views — tables, boards, feeds, grids, and collections.",
  },
  {
    id: "settings",
    title: "Settings & admin",
    description:
      "Account, members, preferences, billing, and admin consoles.",
  },
  {
    id: "patterns",
    title: "UI details & docs",
    description:
      "Component-level patterns, empty states, and docs or help surfaces.",
  },
] as const;

export type ScreenCategoryId = (typeof SCREEN_CATEGORIES)[number]["id"];

export type ScreenCategory = (typeof SCREEN_CATEGORIES)[number];

type CategoryRule = {
  id: ScreenCategoryId;
  /** Match against title, caption, playbookStep, and sourceUrl. */
  pattern: RegExp;
};

/** More specific rules first — first match wins. */
const TITLE_RULES: CategoryRule[] = [
  {
    id: "auth",
    pattern:
      /\b(sign[\s-]?in|sign[\s-]?up|log[\s-]?in|log[\s-]?on|register|onboarding|invite|password[\s-]?(?:reset|change|recovery)|forgot[\s-]?password|sso|otp|verify|unlock\s+screen)\b/i,
  },
  {
    id: "homepage",
    pattern: /\b(homepage|landing|home\s+page|marketing\s+home)\b/i,
  },
  {
    id: "marketing",
    pattern: /\b(marketing|pricing|campaign|promo|feature\s+page|customers?)\b/i,
  },
  {
    id: "navigation",
    pattern:
      /\b(nav|navigation|sidebar|menu|chrome|shell|top[\s-]?bar|breadcrumb|rail)\b/i,
  },
  {
    id: "search",
    pattern:
      /\b(search|composer|filter|filters|browse|discover|results|command[\s-]?palette|find)\b/i,
  },
  {
    id: "dashboard",
    pattern:
      /\b(dashboard|overview|home\s*\/\s*favorites|analytics|insights|summary|report)\b/i,
  },
  {
    id: "settings",
    pattern:
      /\b(settings|admin|members|preferences|account|billing|profile|permissions|workspace\s+settings)\b/i,
  },
  {
    id: "collections",
    pattern:
      /\b(table|board|kanban|list|grid|feed|gallery|collection|inbox|queue)\b/i,
  },
  {
    id: "patterns",
    pattern:
      /\b(docs?|help|support|api|guide|tutorial|reference|changelog|card|modal|dialog|drawer|sheet|toast|empty|tooltip|component|ui\s+detail|review)\b/i,
  },
  {
    id: "workspace",
    pattern:
      /\b(editor|canvas|workspace|detail|compose|document|page\s+editor|record)\b/i,
  },
];

/** Map legacy capture kinds when title heuristics do not fire. */
const KIND_FALLBACK: Record<ProductScreenshotKind, ScreenCategoryId> = {
  homepage: "homepage",
  marketing: "marketing",
  product: "workspace",
  docs: "patterns",
  technical: "patterns",
  supporting: "settings",
  component: "patterns",
};

function haystack(shot: ProductScreenshot): string {
  return [
    shot.title,
    shot.caption,
    shot.playbookStep,
    shot.pageTitle,
    shot.sourceUrl,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Title + playbook step only — avoids caption/URL keywords stealing categories. */
function titleHaystack(shot: ProductScreenshot): string {
  return [shot.title, shot.playbookStep].filter(Boolean).join(" · ");
}

export function categorizeScreenshot(
  shot: ProductScreenshot,
): ScreenCategoryId {
  // Explicit homepage captures stay in Homepage even when titled after a key screen
  // (e.g. Notion’s “Home / Favorites”).
  if (shot.kind === "homepage") return "homepage";

  const titleText = titleHaystack(shot);
  for (const rule of TITLE_RULES) {
    if (rule.pattern.test(titleText)) return rule.id;
  }

  const text = haystack(shot);
  for (const rule of TITLE_RULES) {
    if (rule.pattern.test(text)) return rule.id;
  }

  return KIND_FALLBACK[shot.kind ?? "marketing"] ?? "workspace";
}

export type CategorizedScreens = {
  category: ScreenCategory;
  screenshots: ProductScreenshot[];
};

/** Group shots into taxonomy order; omit empty categories. */
export function groupScreenshotsByCategory(
  screenshots: ProductScreenshot[],
): CategorizedScreens[] {
  const buckets = new Map<ScreenCategoryId, ProductScreenshot[]>();

  for (const shot of screenshots) {
    const id = categorizeScreenshot(shot);
    const list = buckets.get(id);
    if (list) list.push(shot);
    else buckets.set(id, [shot]);
  }

  return SCREEN_CATEGORIES.flatMap((category) => {
    const shots = buckets.get(category.id);
    if (!shots?.length) return [];
    return [{ category, screenshots: shots }];
  });
}
