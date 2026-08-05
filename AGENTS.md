<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:visual-capture -->
# Visual capture

For product screenshots / UI galleries, use the Playwright agent (`npm run capture:ui`), then confirm coverage with `npm run validate:ui` (or the report printed at the end of capture). Remote capture uploads to **Vercel Blob (private)** (`BLOB_READ_WRITE_TOKEN`) and serves via `/api/blob/...`. When homepages are bot-blocked, capture pivots to public design systems / Storybooks / component docs, and runs a broader Playwright web UI search (design-system crawl, Brave/Bing, YouTube demos, seed-page expansion). Locator clips also store per-element structured JSON (DOM, styles, CSS vars, layout, interaction) on `screenshots[].element`. See `.cursor/rules/visual-capture.mdc`.
<!-- END:visual-capture -->
