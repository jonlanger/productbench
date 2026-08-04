import { batch4Manifest } from "./batch-4-manifest";
import { expandProductManifest } from "./lib/product-factory";
import type { Product } from "./types";

export const batch4Products: Product[] = batch4Manifest.map((entry, index) =>
  expandProductManifest(entry, String(351 + index)),
);
