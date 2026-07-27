import type {
  FilterState,
  Platform,
  PricingModel,
  Product,
  ProductCategory,
  SortOption,
  UxDensity,
} from "@/data/types";
import { matchesProductSearch, scoreProductSearch } from "@/lib/product-search";

export const CATEGORIES: ProductCategory[] = [
  "enterprise",
  "consumer",
  "industrial",
  "saas",
  "fintech",
  "healthcare",
  "devtools",
  "ecommerce",
  "productivity",
  "security",
];

export const SEGMENTS = ["B2B", "B2C", "B2B2C", "internal"] as const;

export const PLATFORMS: Platform[] = [
  "web",
  "ios",
  "android",
  "desktop",
  "api",
  "cli",
];

export const PRICING: PricingModel[] = [
  "free",
  "freemium",
  "subscription",
  "enterprise",
  "usage-based",
  "one-time",
];

export const DENSITIES: UxDensity[] = ["compact", "comfortable", "spacious"];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "founded-desc", label: "Newest founded" },
  { value: "founded-asc", label: "Oldest founded" },
  { value: "pages-desc", label: "Most pages" },
  { value: "pages-asc", label: "Fewest pages" },
  { value: "features-desc", label: "Most features" },
  { value: "screens-desc", label: "Most screens" },
];

export const DEFAULT_SORT: SortOption = "name-asc";

export type PageCountBounds = {
  min: number;
  max: number;
};

export type FilterFacets = {
  techStack: string[];
  features: string[];
  industries: string[];
  pageCountBounds: PageCountBounds;
};

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function getPageCountBounds(items: Product[]): PageCountBounds {
  if (items.length === 0) {
    return { min: 0, max: 100 };
  }

  return {
    min: Math.min(...items.map((p) => p.metrics.pageCount)),
    max: Math.max(...items.map((p) => p.metrics.pageCount)),
  };
}

export function getFilterFacets(items: Product[]): FilterFacets {
  return {
    techStack: uniqueSorted(items.flatMap((p) => p.techStack)),
    features: uniqueSorted(items.flatMap((p) => p.features)),
    industries: uniqueSorted(items.flatMap((p) => p.industries)),
    pageCountBounds: getPageCountBounds(items),
  };
}

export function getDefaultFilters(items: Product[]): FilterState {
  const bounds = getPageCountBounds(items);
  return {
    query: "",
    categories: [],
    segments: [],
    platforms: [],
    pricing: [],
    techStack: [],
    features: [],
    industries: [],
    density: [],
    pageCountRange: [bounds.min, bounds.max],
    sort: DEFAULT_SORT,
  };
}

function matchesQuery(product: Product, query: string): boolean {
  return matchesProductSearch(product, query);
}

function includesAll<T>(selected: T[], available: T[]): boolean {
  if (selected.length === 0) return true;
  return selected.every((item) => available.includes(item));
}

function includesAny<T>(selected: T[], available: T[]): boolean {
  if (selected.length === 0) return true;
  return selected.some((item) => available.includes(item));
}

export function sortProducts(items: Product[], sort: SortOption): Product[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sort) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "founded-desc":
        return b.founded - a.founded || a.name.localeCompare(b.name);
      case "founded-asc":
        return a.founded - b.founded || a.name.localeCompare(b.name);
      case "pages-desc":
        return (
          b.metrics.pageCount - a.metrics.pageCount ||
          a.name.localeCompare(b.name)
        );
      case "pages-asc":
        return (
          a.metrics.pageCount - b.metrics.pageCount ||
          a.name.localeCompare(b.name)
        );
      case "features-desc":
        return (
          b.metrics.featureCount - a.metrics.featureCount ||
          a.name.localeCompare(b.name)
        );
      case "screens-desc":
        return (
          b.metrics.screenCount - a.metrics.screenCount ||
          a.name.localeCompare(b.name)
        );
      default:
        return a.name.localeCompare(b.name);
    }
  });
  return sorted;
}

export function filterProducts(
  items: Product[],
  filters: FilterState,
): Product[] {
  const query = filters.query.trim();
  const filtered = items.filter((product) => {
    if (!matchesQuery(product, filters.query)) return false;

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(product.category)
    ) {
      return false;
    }

    if (!includesAny(filters.segments, product.segments)) return false;
    if (!includesAny(filters.platforms, product.platforms)) return false;
    if (
      filters.pricing.length > 0 &&
      !filters.pricing.includes(product.pricing)
    ) {
      return false;
    }
    if (!includesAll(filters.techStack, product.techStack)) return false;
    if (!includesAny(filters.features, product.features)) return false;
    if (!includesAny(filters.industries, product.industries)) return false;
    if (
      filters.density.length > 0 &&
      !filters.density.includes(product.ux.density)
    ) {
      return false;
    }

    const [minPages, maxPages] = filters.pageCountRange;
    if (
      product.metrics.pageCount < minPages ||
      product.metrics.pageCount > maxPages
    ) {
      return false;
    }

    return true;
  });

  if (query) {
    return [...filtered].sort((a, b) => {
      const scoreDelta =
        scoreProductSearch(b, query) - scoreProductSearch(a, query);
      if (scoreDelta !== 0) return scoreDelta;
      return a.name.localeCompare(b.name);
    });
  }

  return sortProducts(filtered, filters.sort);
}

export function countActiveFilters(
  filters: FilterState,
  pageCountBounds: PageCountBounds,
): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  count += filters.categories.length;
  count += filters.segments.length;
  count += filters.platforms.length;
  count += filters.pricing.length;
  count += filters.techStack.length;
  count += filters.features.length;
  count += filters.industries.length;
  count += filters.density.length;
  if (
    filters.pageCountRange[0] !== pageCountBounds.min ||
    filters.pageCountRange[1] !== pageCountBounds.max
  ) {
    count += 1;
  }
  return count;
}

export function formatLabel(value: string): string {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
