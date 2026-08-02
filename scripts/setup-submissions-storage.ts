/**
 * Screenshot submissions use Vercel Blob (private) under submissions/{userId}/.
 * See: npm run storage:setup-screenshots
 */

console.log(
  [
    "User screenshot submissions use Vercel Blob (private), not Supabase Storage.",
    "",
    "Ensure BLOB_READ_WRITE_TOKEN is set (vercel env pull .env.local).",
    "Uploads go through /api/blob/upload → path submissions/{userId}/{slug}/...",
    "Reads are proxied at /api/blob/submissions/... (owner or admin).",
  ].join("\n"),
);
