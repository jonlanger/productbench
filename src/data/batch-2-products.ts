import { batch2ManifestA } from "./batch-2-manifest-a";
import { batch2ManifestB } from "./batch-2-manifest-b";
import { expandProductManifest } from "./lib/product-factory";
import type { Product } from "./types";

const manifest = [...batch2ManifestA, ...batch2ManifestB];

export const batch2Products: Product[] = manifest.map((entry, index) =>
  expandProductManifest(entry, String(51 + index)),
);
