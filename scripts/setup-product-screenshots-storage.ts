/**
 * One-time guidance for creating a private Vercel Blob store.
 *
 *   npm run storage:setup-screenshots
 */

console.log(
  [
    "Product screenshots, avatars, and submissions use Vercel Blob (private).",
    "",
    "1. Create a private store (CLI ≥ 50.20.0):",
    "   vercel blob create-store productbench --access private",
    "",
    "2. Or in the Vercel dashboard: Storage → Create → Blob → Private",
    "",
    "3. Pull env vars into .env.local:",
    "   vercel env pull .env.local",
    "",
    "   Ensure BLOB_READ_WRITE_TOKEN is set.",
    "",
    "4. Sync local captures:",
    "   npm run storage:sync-screenshots -- --slug=<product>",
    "   npm run storage:sync-screenshots -- --all",
  ].join("\n"),
);
