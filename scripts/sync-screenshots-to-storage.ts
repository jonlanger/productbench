/**
 * Upload local capture images to Vercel Blob (private) and rewrite DB src URLs.
 *
 *   npm run storage:sync-screenshots -- --slug=notion
 *   npm run storage:sync-screenshots -- --all [--limit=N]
 */

import { config } from "dotenv";
import { existsSync, readdirSync } from "fs";
import { join } from "path";

import { syncProductScreenshotsToStorage } from "./lib/sync-product-screenshots-storage";
import { hasStorageUploadConfig } from "./lib/supabase-admin";

config({ path: ".env.local" });
config();

function argFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function argValue(name: string) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function listLocalSlugs(): string[] {
  const root = join(process.cwd(), "public/products");
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) =>
      readdirSync(join(root, slug)).some((f) =>
        /\.(png|jpe?g|webp|gif)$/i.test(f),
      ),
    )
    .sort();
}

async function main() {
  const slug = argValue("slug");
  const runAll = argFlag("all");
  const limit = Number(argValue("limit") ?? 0);

  if (!slug && !runAll) {
    console.error(
      [
        "Usage:",
        "  npm run storage:sync-screenshots -- --slug=<product>",
        "  npm run storage:sync-screenshots -- --all [--limit=N] [--offset=N]",
        "",
        "Requires BLOB_READ_WRITE_TOKEN.",
        "Create a private Blob store: vercel blob create-store productbench --access private",
      ].join("\n"),
    );
    process.exit(1);
  }

  if (!hasStorageUploadConfig()) {
    console.error("Missing BLOB_READ_WRITE_TOKEN.");
    process.exit(1);
  }

  let slugs = runAll ? listLocalSlugs() : [slug!];
  const offset = Number(argValue("offset") ?? "0");
  if (offset > 0) slugs = slugs.slice(offset);
  if (limit > 0) slugs = slugs.slice(0, limit);

  if (slugs.length === 0) {
    console.error("No local product screenshot folders found.");
    process.exit(1);
  }

  console.log(`Syncing ${slugs.length} product(s) → Vercel Blob…`);
  let uploaded = 0;
  let rewritten = 0;
  let failed = 0;

  for (const s of slugs) {
    process.stdout.write(`  ${s}… `);
    try {
      const result = await syncProductScreenshotsToStorage(s);
      if (result.skipped) {
        console.log(`skipped (${result.reason})`);
        continue;
      }
      uploaded += result.uploaded;
      rewritten += result.rewritten;
      console.log(
        `uploaded ${result.uploaded} · rewrote ${result.rewritten} DB src(s)`,
      );
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`failed (${message.slice(0, 120)})`);
    }
  }

  console.log(
    `\nDone: ${uploaded} files uploaded · ${rewritten} DB srcs updated` +
      (failed ? ` · ${failed} failed` : ""),
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
