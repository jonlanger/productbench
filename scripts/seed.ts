import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { products as seedProducts } from "../src/data/products";
import { products } from "../src/db/schema";

config({ path: ".env.local" });
config();

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Supabase connection string.",
    );
  }

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  const rows = seedProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    longDescription: product.longDescription,
    category: product.category,
    segments: product.segments,
    industries: product.industries,
    website: product.website,
    founded: product.founded,
    company: product.company,
    headquarters: product.headquarters,
    pricing: product.pricing,
    platforms: product.platforms,
    techStack: product.techStack,
    features: product.features,
    workflows: product.workflows,
    ux: product.ux,
    metrics: product.metrics,
    integrations: product.integrations,
    competitors: product.competitors,
    accent: product.accent,
    bentoSize: product.bentoSize,
    tags: product.tags,
    isPublic: product.isPublic !== false,
    screenshots: product.screenshots ?? [],
  }));

  console.log(`Seeding ${rows.length} products…`);

  await db
    .insert(products)
    .values(rows)
    .onConflictDoUpdate({
      target: products.id,
      set: {
        slug: sql`excluded.slug`,
        name: sql`excluded.name`,
        tagline: sql`excluded.tagline`,
        description: sql`excluded.description`,
        longDescription: sql`excluded.long_description`,
        category: sql`excluded.category`,
        segments: sql`excluded.segments`,
        industries: sql`excluded.industries`,
        website: sql`excluded.website`,
        founded: sql`excluded.founded`,
        company: sql`excluded.company`,
        headquarters: sql`excluded.headquarters`,
        pricing: sql`excluded.pricing`,
        platforms: sql`excluded.platforms`,
        techStack: sql`excluded.tech_stack`,
        features: sql`excluded.features`,
        workflows: sql`excluded.workflows`,
        ux: sql`excluded.ux`,
        metrics: sql`excluded.metrics`,
        integrations: sql`excluded.integrations`,
        competitors: sql`excluded.competitors`,
        accent: sql`excluded.accent`,
        bentoSize: sql`excluded.bento_size`,
        tags: sql`excluded.tags`,
        isPublic: sql`excluded.is_public`,
        // Preserve screenshots + captureInsights collected by Playwright
        updatedAt: sql`now()`,
      },
    });

  console.log("Seed complete.");
  await client.end();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
