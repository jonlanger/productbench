/**
 * Avatars are stored in Vercel Blob (private) under avatars/{userId}/.
 * See: npm run storage:setup-screenshots
 */

console.log(
  [
    "Profile photos use Vercel Blob (private), not Supabase Storage.",
    "",
    "Ensure BLOB_READ_WRITE_TOKEN is set (vercel env pull .env.local).",
    "Uploads go through /api/blob/upload → path avatars/{userId}/avatar.{ext}",
    "Reads are proxied at /api/blob/avatars/...",
  ].join("\n"),
);
