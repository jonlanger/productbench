import { asc, eq } from "drizzle-orm";
import { cache } from "react";

import { products as seedProducts } from "@/data/products";
import type { Product } from "@/data/types";
import { getDb, hasDatabaseUrl } from "@/db";
import { products as productsTable, type ProductRow } from "@/db/schema";
import { getViewer } from "@/lib/auth";

function isPublicProduct(product: Pick<Product, "isPublic">): boolean {
  return product.isPublic !== false;
}

function seedAsProducts(): Product[] {
  return seedProducts.map((product) => ({
    ...product,
    isPublic: product.isPublic !== false,
    screenshots: product.screenshots ?? [],
    captureInsights: product.captureInsights ?? null,
  }));
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    longDescription: row.longDescription,
    category: row.category,
    segments: row.segments,
    industries: row.industries,
    website: row.website,
    founded: row.founded,
    company: row.company,
    headquarters: row.headquarters,
    pricing: row.pricing,
    platforms: row.platforms,
    techStack: row.techStack,
    features: row.features,
    workflows: row.workflows,
    ux: row.ux,
    metrics: row.metrics,
    integrations: row.integrations,
    competitors: row.competitors,
    accent: row.accent,
    bentoSize: row.bentoSize,
    tags: row.tags,
    isPublic: row.isPublic,
    screenshots: row.screenshots ?? [],
    captureInsights: row.captureInsights ?? null,
  };
}

function filterForViewer(products: Product[], isAdmin: boolean): Product[] {
  if (isAdmin) return products;
  return products.filter(isPublicProduct);
}

/** Full catalog — prefer getVisibleProducts for request-scoped UI. */
export const getAllProducts = cache(async (): Promise<Product[]> => {
  if (!hasDatabaseUrl()) {
    return seedAsProducts();
  }

  try {
    const rows = await getDb()
      .select()
      .from(productsTable)
      .orderBy(asc(productsTable.name));

    return rows.map(rowToProduct);
  } catch (error) {
    console.error(
      "[getAllProducts] database query failed; falling back to seed catalog.",
      error,
    );
    return seedAsProducts();
  }
});

/** Catalog visible to the current viewer (public set for guests, full for admins). */
export const getVisibleProducts = cache(async (): Promise<Product[]> => {
  const { isAdmin } = await getViewer();
  return filterForViewer(await getAllProducts(), isAdmin);
});

export const getProductBySlug = cache(
  async (slug: string): Promise<Product | undefined> => {
    if (!hasDatabaseUrl()) {
      return seedAsProducts().find((product) => product.slug === slug);
    }

    try {
      const [row] = await getDb()
        .select()
        .from(productsTable)
        .where(eq(productsTable.slug, slug))
        .limit(1);

      return row ? rowToProduct(row) : undefined;
    } catch (error) {
      console.error(
        `[getProductBySlug] database query failed for "${slug}"; falling back to seed.`,
        error,
      );
      return seedAsProducts().find((product) => product.slug === slug);
    }
  },
);

/** Product detail access — hides non-public entries from non-admins. */
export const getVisibleProductBySlug = cache(
  async (slug: string): Promise<Product | undefined> => {
    const product = await getProductBySlug(slug);
    if (!product) return undefined;

    const { isAdmin } = await getViewer();
    if (isAdmin || isPublicProduct(product)) return product;
    return undefined;
  },
);

export const getAllProductSlugs = cache(async (): Promise<string[]> => {
  if (!hasDatabaseUrl()) {
    return seedProducts.map((product) => product.slug);
  }

  try {
    const rows = await getDb()
      .select({ slug: productsTable.slug })
      .from(productsTable)
      .orderBy(asc(productsTable.slug));

    return rows.map((row) => row.slug);
  } catch (error) {
    console.error(
      "[getAllProductSlugs] database query failed; falling back to seed.",
      error,
    );
    return seedProducts.map((product) => product.slug);
  }
});

/** Public-only slugs for static generation / guest SEO. */
export const getPublicProductSlugs = cache(async (): Promise<string[]> => {
  if (!hasDatabaseUrl()) {
    return seedAsProducts()
      .filter(isPublicProduct)
      .map((product) => product.slug);
  }

  try {
    const rows = await getDb()
      .select({ slug: productsTable.slug })
      .from(productsTable)
      .where(eq(productsTable.isPublic, true))
      .orderBy(asc(productsTable.slug));

    return rows.map((row) => row.slug);
  } catch (error) {
    console.error(
      "[getPublicProductSlugs] database query failed; falling back to seed.",
      error,
    );
    return seedAsProducts()
      .filter(isPublicProduct)
      .map((product) => product.slug);
  }
});

export const getFeaturedProducts = cache(
  async (slugs: string[]): Promise<Product[]> => {
    const visible = await getVisibleProducts();
    return slugs
      .map((slug) => visible.find((product) => product.slug === slug))
      .filter((product): product is Product => Boolean(product));
  },
);

export async function getCatalogStats() {
  const { isAdmin } = await getViewer();
  const all = await getAllProducts();
  const publicCount = all.filter(isPublicProduct).length;

  return {
    isAdmin,
    publicCount,
    totalCount: all.length,
    visibleCount: isAdmin ? all.length : publicCount,
  };
}
