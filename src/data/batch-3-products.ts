import { batch3Manifest } from "./batch-3-manifest";
import { expandProductManifest } from "./lib/product-factory";
import type { Product } from "./types";

export const batch3Products: Product[] = batch3Manifest.map((entry, index) =>
  expandProductManifest(entry, String(251 + index)),
);
