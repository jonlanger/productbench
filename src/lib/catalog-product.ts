import type { Product } from "@/data/types";

/** Strip heavy gallery payloads from catalog cards — detail pages load full screenshots. */
export function stripProductForCatalog(product: Product): Product {
  const screenshotCount =
    product.screenshots?.length ?? product.captureInsights?.screenshotCount ?? 0;

  return {
    ...product,
    screenshots: undefined,
    captureInsights: product.captureInsights
      ? {
          ...product.captureInsights,
          screenshotCount,
          pages: [],
        }
      : null,
  };
}
