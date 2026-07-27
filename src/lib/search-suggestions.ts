import type { FilterState, Product } from "@/data/types";
import {
  CATEGORIES,
  DENSITIES,
  PLATFORMS,
  PRICING,
  SEGMENTS,
  formatLabel,
} from "@/lib/filters";

export type SuggestionKind =
  | "product"
  | "company"
  | "tag"
  | "feature"
  | "tech"
  | "industry"
  | "category"
  | "segment"
  | "platform"
  | "pricing"
  | "density"
  | "pattern"
  | "integration"
  | "competitor";

export type SearchSuggestion = {
  id: string;
  kind: SuggestionKind;
  label: string;
  description: string;
  /** Navigate to product detail */
  productSlug?: string;
  /** Apply a catalog filter facet */
  filterKey?: keyof Pick<
    FilterState,
    | "categories"
    | "segments"
    | "platforms"
    | "pricing"
    | "techStack"
    | "features"
    | "industries"
    | "density"
  >;
  filterValue?: string;
  /** Use as free-text search query */
  query?: string;
};

type IndexedSuggestion = SearchSuggestion & {
  searchText: string;
  priority: number;
};

const KIND_PRIORITY: Record<SuggestionKind, number> = {
  product: 100,
  company: 90,
  feature: 80,
  tag: 75,
  tech: 70,
  industry: 65,
  category: 60,
  pattern: 55,
  platform: 50,
  segment: 48,
  pricing: 45,
  density: 42,
  integration: 40,
  competitor: 35,
};

const KIND_LABEL: Record<SuggestionKind, string> = {
  product: "Product",
  company: "Company",
  tag: "Tag",
  feature: "Feature",
  tech: "Tech",
  industry: "Industry",
  category: "Category",
  segment: "Segment",
  platform: "Platform",
  pricing: "Pricing",
  density: "Density",
  pattern: "UX pattern",
  integration: "Integration",
  competitor: "Competitor",
};

export function suggestionKindLabel(kind: SuggestionKind): string {
  return KIND_LABEL[kind];
}

function pushUnique(
  map: Map<string, IndexedSuggestion>,
  item: IndexedSuggestion,
) {
  if (!map.has(item.id)) {
    map.set(item.id, item);
  }
}

function facetItem(
  kind: SuggestionKind,
  value: string,
  filterKey: IndexedSuggestion["filterKey"],
  description?: string,
): IndexedSuggestion {
  return {
    id: `${kind}:${value.toLowerCase()}`,
    kind,
    label: formatLabel(value),
    description: description ?? KIND_LABEL[kind],
    filterKey,
    filterValue: value,
    searchText: `${value} ${formatLabel(value)}`.toLowerCase(),
    priority: KIND_PRIORITY[kind],
  };
}

/** Build a searchable suggestion index from the visible catalog. */
export function buildSearchIndex(products: Product[]): IndexedSuggestion[] {
  const map = new Map<string, IndexedSuggestion>();

  for (const product of products) {
    pushUnique(map, {
      id: `product:${product.slug}`,
      kind: "product",
      label: product.name,
      description: product.company,
      productSlug: product.slug,
      searchText:
        `${product.name} ${product.company} ${product.tagline} ${product.slug}`.toLowerCase(),
      priority: KIND_PRIORITY.product,
    });

    pushUnique(map, {
      id: `company:${product.company.toLowerCase()}`,
      kind: "company",
      label: product.company,
      description: "Company",
      query: product.company,
      searchText: product.company.toLowerCase(),
      priority: KIND_PRIORITY.company,
    });

    for (const tag of product.tags) {
      pushUnique(map, {
        id: `tag:${tag.toLowerCase()}`,
        kind: "tag",
        label: tag,
        description: "Tag",
        query: tag,
        searchText: tag.toLowerCase(),
        priority: KIND_PRIORITY.tag,
      });
    }

    for (const feature of product.features) {
      pushUnique(
        map,
        facetItem("feature", feature, "features", "Feature"),
      );
    }

    for (const tech of product.techStack) {
      pushUnique(map, facetItem("tech", tech, "techStack", "Tech stack"));
    }

    for (const industry of product.industries) {
      pushUnique(
        map,
        facetItem("industry", industry, "industries", "Industry"),
      );
    }

    for (const pattern of product.ux.patterns) {
      pushUnique(map, {
        id: `pattern:${pattern.toLowerCase()}`,
        kind: "pattern",
        label: pattern,
        description: "UX pattern",
        query: pattern,
        searchText: pattern.toLowerCase(),
        priority: KIND_PRIORITY.pattern,
      });
    }

    for (const integration of product.integrations) {
      pushUnique(map, {
        id: `integration:${integration.toLowerCase()}`,
        kind: "integration",
        label: integration,
        description: "Integration",
        query: integration,
        searchText: integration.toLowerCase(),
        priority: KIND_PRIORITY.integration,
      });
    }

    for (const competitor of product.competitors) {
      pushUnique(map, {
        id: `competitor:${competitor.toLowerCase()}`,
        kind: "competitor",
        label: competitor,
        description: "Competitor",
        query: competitor,
        searchText: competitor.toLowerCase(),
        priority: KIND_PRIORITY.competitor,
      });
    }
  }

  for (const category of CATEGORIES) {
    pushUnique(map, facetItem("category", category, "categories"));
  }
  for (const segment of SEGMENTS) {
    pushUnique(map, facetItem("segment", segment, "segments"));
  }
  for (const platform of PLATFORMS) {
    pushUnique(map, facetItem("platform", platform, "platforms"));
  }
  for (const pricing of PRICING) {
    pushUnique(map, facetItem("pricing", pricing, "pricing"));
  }
  for (const density of DENSITIES) {
    pushUnique(map, facetItem("density", density, "density"));
  }

  return [...map.values()];
}

function scoreMatch(searchText: string, query: string): number {
  if (searchText === query) return 1000;
  if (searchText.startsWith(query)) return 800;
  const words = searchText.split(/[\s/,|]+/);
  if (words.some((word) => word.startsWith(query))) return 600;
  if (searchText.includes(query)) return 400;
  return 0;
}

/** Rank and return up to `limit` suggestions for a keyword. */
export function getSearchSuggestions(
  index: IndexedSuggestion[],
  query: string,
  limit = 5,
): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = index
    .map((item) => {
      const matchScore = scoreMatch(item.searchText, q);
      if (matchScore === 0) return null;
      return {
        item,
        score: matchScore + item.priority,
      };
    })
    .filter((entry): entry is { item: IndexedSuggestion; score: number } =>
      Boolean(entry),
    )
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));

  const picked: SearchSuggestion[] = [];
  const seenKinds = new Set<SuggestionKind>();
  const usedIds = new Set<string>();

  function take(item: IndexedSuggestion) {
    const { searchText: _s, priority: _p, ...suggestion } = item;
    void _s;
    void _p;
    picked.push(suggestion);
    usedIds.add(item.id);
    seenKinds.add(item.kind);
  }

  // Prefer one match per kind first for a mixed dropdown.
  for (const { item } of scored) {
    if (picked.length >= limit) break;
    if (seenKinds.has(item.kind)) continue;
    take(item);
  }

  for (const { item } of scored) {
    if (picked.length >= limit) break;
    if (usedIds.has(item.id)) continue;
    take(item);
  }

  return picked;
}
