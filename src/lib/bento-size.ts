import type { BentoSize, Product } from "@/data/types";

/** Weighted, log-scaled signal for how much catalog content a product has. */
export function getProductContentScore(product: Product): number {
  const metrics = product.metrics;
  const screenshotCount =
    product.screenshots?.length ?? product.captureInsights?.screenshotCount ?? 0;
  const capturePageCount = product.captureInsights?.pageCount ?? 0;

  return (
    Math.log1p(metrics.pageCount) * 12 +
    Math.log1p(metrics.screenCount) * 8 +
    Math.log1p(metrics.featureCount) * 5 +
    product.workflows.length * 6 +
    product.features.length * 2 +
    screenshotCount * 4 +
    capturePageCount * 3 +
    Math.min(product.longDescription.length / 200, 8)
  );
}

function pickLargeShape(product: Product, rank: number): "wide" | "tall" {
  const workflowHeavy = product.workflows.length >= 4;
  const platformHeavy = product.platforms.length >= 4;

  if (workflowHeavy && !platformHeavy) return "tall";
  if (platformHeavy && !workflowHeavy) return "wide";
  return rank % 2 === 0 ? "wide" : "tall";
}

function sizeForRank(rank: number, total: number, product: Product): BentoSize {
  if (total <= 1) return "lg";
  if (total === 2) return rank === 0 ? "lg" : "md";
  if (total === 3) {
    if (rank === 0) return "lg";
    if (rank === 1) return "md";
    return "sm";
  }

  const ratio = rank / (total - 1);

  if (ratio <= 0.04) return "hero";
  if (ratio <= 0.12) return "lg";
  if (ratio <= 0.32) return pickLargeShape(product, rank);
  if (ratio <= 0.58) return "md";
  return "sm";
}

/**
 * Assign bento card sizes from content depth within a visible product set.
 * Sort order is unchanged — this only affects card footprint in the grid.
 */
export function assignBentoSizes(products: Product[]): Map<string, BentoSize> {
  const sizes = new Map<string, BentoSize>();
  if (products.length === 0) return sizes;

  const ranked = [...products].sort(
    (a, b) => getProductContentScore(b) - getProductContentScore(a),
  );

  ranked.forEach((product, rank) => {
    sizes.set(product.id, sizeForRank(rank, ranked.length, product));
  });

  return sizes;
}

export const bentoSizeClass: Record<BentoSize, string> = {
  sm: "col-span-1 row-span-1",
  md: "col-span-1 row-span-1",
  lg: "col-span-1 row-span-1 sm:col-span-2 sm:row-span-2",
  wide: "col-span-1 row-span-1 sm:col-span-2",
  tall: "col-span-1 row-span-1 sm:row-span-2",
  hero: "col-span-1 row-span-1 sm:col-span-2 sm:row-span-2 xl:col-span-2",
};

export function isLargeBentoSize(size: BentoSize): boolean {
  return size === "hero" || size === "lg" || size === "tall" || size === "wide";
}
