import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { writeFileSync } from "fs";
import postgres from "postgres";

import { products as productsTable } from "../src/db/schema";
import type { ProductScreenshot } from "../src/data/types";

config({ path: ".env.local" });
config();

type Collected = {
  slug: string;
  name: string;
  website: string;
  screenshots: ProductScreenshot[];
  sources: string[];
};

function absolutize(base: string, value: string | undefined | null) {
  if (!value) return null;
  try {
    return new URL(value, base).href;
  } catch {
    return null;
  }
}

function extractMetaImages(html: string, pageUrl: string) {
  const images: { src: string; title: string; caption?: string }[] = [];
  const seen = new Set<string>();

  function push(src: string | null, title: string, caption?: string) {
    if (!src || seen.has(src)) return;
    if (!/^https?:\/\//i.test(src)) return;
    seen.add(src);
    images.push({ src, title, caption });
  }

  const patterns: Array<{
    re: RegExp;
    title: string;
    caption: string;
  }> = [
    {
      re: /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/gi,
      title: "Marketing preview",
      caption: "Open Graph image from the product website",
    },
    {
      re: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/gi,
      title: "Marketing preview",
      caption: "Open Graph image from the product website",
    },
    {
      re: /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
      title: "Product hero",
      caption: "Primary Open Graph image",
    },
    {
      re: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi,
      title: "Product hero",
      caption: "Primary Open Graph image",
    },
    {
      re: /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
      title: "Social preview",
      caption: "Twitter/X card image",
    },
    {
      re: /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/gi,
      title: "Social preview",
      caption: "Twitter/X card image",
    },
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern.re)) {
      push(absolutize(pageUrl, match[1]), pattern.title, pattern.caption);
    }
  }

  // A few large in-page images as secondary candidates
  for (const match of html.matchAll(
    /<img[^>]+(?:src|data-src)=["']([^"']+\.(?:png|jpe?g|webp)[^"']*)["'][^>]*>/gi,
  )) {
    const src = absolutize(pageUrl, match[1]);
    if (!src) continue;
    if (/logo|icon|avatar|sprite|emoji|favicon|1x1|pixel/i.test(src)) continue;
    push(src, "Interface capture", "Image discovered on the product homepage");
    if (images.length >= 6) break;
  }

  return images.slice(0, 6);
}

async function fetchPage(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "ProductBenchResearchBot/0.1 (+local research catalog collector)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(url, { prepare: false, max: 1, ssl: "require" });
  const db = drizzle(client);

  const rows = await db
    .select({
      id: productsTable.id,
      slug: productsTable.slug,
      name: productsTable.name,
      website: productsTable.website,
      keyScreens: productsTable.ux,
    })
    .from(productsTable);

  const collected: Collected[] = [];
  let updated = 0;

  for (const row of rows) {
    const keyScreens = row.keyScreens?.keyScreens ?? [];
    const sources: string[] = [];
    let screenshots: ProductScreenshot[] = [];

    try {
      const html = await fetchPage(row.website);
      sources.push(row.website);
      screenshots = extractMetaImages(html, row.website);

      // Pair key screen names onto collected images for richer captions
      screenshots = screenshots.map((shot, index) => {
        const screen = keyScreens[index];
        if (!screen) return shot;
        return {
          ...shot,
          title: screen,
          caption: shot.caption
            ? `${shot.caption} · Mapped to key screen “${screen}”`
            : `Key screen: ${screen}`,
        };
      });

      // Ensure every key screen has a carousel slot; reuse hero image when needed
      const hero = screenshots[0]?.src;
      if (hero) {
        for (const screen of keyScreens) {
          if (screenshots.some((s) => s.title === screen)) continue;
          screenshots.push({
            title: screen,
            src: hero,
            caption: `Key screen placeholder using product marketing visual`,
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Skip scrape ${row.slug}: ${message}`);
    }

    // Fallback: live page snapshot service when marketing images are blocked
    if (screenshots.length === 0) {
      const snapshot = `https://image.thum.io/get/width/1400/noanimate/${encodeURIComponent(row.website)}`;
      sources.push("thum.io");
      screenshots = (keyScreens.length > 0 ? keyScreens : ["Homepage"]).map(
        (screen, index) => ({
          title: screen,
          src: snapshot,
          caption:
            index === 0
              ? "Live homepage snapshot (fallback when marketing assets were unavailable)"
              : `Key screen: ${screen} · using homepage snapshot until a dedicated capture exists`,
        }),
      );
    }

    // Dedupe by title keeping first src
    const deduped: ProductScreenshot[] = [];
    const titles = new Set<string>();
    for (const shot of screenshots) {
      if (titles.has(shot.title)) continue;
      titles.add(shot.title);
      deduped.push(shot);
    }

    collected.push({
      slug: row.slug,
      name: row.name,
      website: row.website,
      screenshots: deduped,
      sources,
    });

    if (deduped.length > 0) {
      await db
        .update(productsTable)
        .set({
          screenshots: deduped,
          updatedAt: new Date(),
        })
        .where(eq(productsTable.id, row.id));
      updated += 1;
      console.log(`✓ ${row.slug}: ${deduped.length} screenshots`);
    } else {
      console.log(`· ${row.slug}: none found`);
    }
  }

  writeFileSync(
    "src/data/collected-screenshots.json",
    JSON.stringify(collected, null, 2),
  );

  console.log(
    `\nDone. Updated ${updated}/${rows.length} products. Wrote src/data/collected-screenshots.json`,
  );
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
