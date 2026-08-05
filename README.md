# ProductBench

Research catalog of enterprise, consumer, and industrial software — UX patterns, workflows, tech stacks, and product architecture.

## Stack

- Next.js (App Router)
- Postgres (via Drizzle ORM) — any host (Neon, Supabase, etc.)
- Vercel Blob (private) for product screenshots, avatars, and submissions (local `public/products` is the capture workspace)

Account auth is currently **disabled** in code (`isAuthEnabled()`). The catalog is browsable without signing in. Do not expect `/sign-in` to work until a new auth provider is wired up.

Without `DATABASE_URL`, the app falls back to the TypeScript seed catalog in `src/data/`.

## Setup

### 1. Install

```bash
npm install
```

### 2. Postgres (optional)

1. Provision a Postgres database (Neon, Supabase, Railway, etc.).
2. Copy the connection string.
   - App runtime: prefer a **pooled** URI when available (e.g. port `6543` on Supabase).
   - Schema push: if `db:push` fails on the pooler, temporarily use the **direct** URI (port `5432`).

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

```env
DATABASE_URL=postgresql://...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
ADMIN_EMAILS=you@example.com
```

`ADMIN_EMAILS` is reserved for when auth is re-enabled (comma-separated allowlist for the full catalog, including `is_public = false`). With auth off, guests see the public set only.

`BLOB_READ_WRITE_TOKEN` comes from a **private** Vercel Blob store (capture uploads + avatar/submission client uploads). Never expose it as `NEXT_PUBLIC_*`.

Optional legacy Supabase Auth keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) are unused while `isAuthEnabled()` returns false.

### 4. Blob store + schema

```bash
# Private Blob store (CLI ≥ 50.20.0), then pull env:
vercel blob create-store productbench --access private
vercel env pull .env.local

npm run db:push
npm run db:seed
npm run storage:setup-screenshots   # prints Blob setup reminders
```

Avatars (`/account`) and screenshot submissions (`/admin/submissions`) use the same private Blob store, served through `/api/blob/...`.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Screenshots

Preferred path is Playwright live UI capture. When a site is bot-blocked or the live run is thin (fewer than 14 shots), capture automatically runs a **web fallback** chain:

1. Design-system / Storybook / component docs (curated `designSystem` URLs, known registry, path probes, light web search)
2. Curated docs/help/technical pages (`src/data/visual-sources.ts`) → download UI images
3. Open Graph / Twitter meta images from the homepage
4. thum.io live homepage snapshot (last resort for live marketing)
5. Apple App Store screenshots when `appStoreId` is curated (reserved slots so docs cannot starve them)
6. Wayback Machine archived page images / snapshot
7. YouTube posters + auto frame stills (`0–3.jpg`) when `youtube` URLs are curated

Live Playwright also visits design-system sources **before** homepage-dependent steps, so bot-blocked marketing sites still yield component/token/UI evidence.

```bash
# Legacy standalone scrapers (still useful for marketing-only enrichment)
npm run db:collect-screenshots
npm run db:enrich-screenshots

# Preferred: Playwright live UI capture (+ automatic fallback + coverage check)
npm run capture:install
npm run capture:ui -- --slug=notion
npm run capture:ui -- --all                 # every product
npm run capture:ui -- --all --limit=5       # smoke test
npm run validate:ui -- --slug=notion        # taxonomy coverage vs capture-process.ts
npm run validate:ui -- --all
```

Playwright loads every catalog product (from Supabase when `DATABASE_URL` is set, otherwise seed data). Each product gets a **generic** playbook (homepage, card crop, account menu, sign-in, supporting docs URLs). Products with custom flows can ship a richer override — Airbnb is the first.

Each run also extracts **live insights** (nav labels, CTAs, headings, tech/pattern signals) into `capture_insights`, and soft-merges candidates into features / UX patterns / platforms / metrics without wiping curated seed copy.

Locator clips (cards, nav, dialogs, hover menus, interactive states) also write **per-element structured JSON** onto `products.screenshots[].element`: DOM/ARIA semantics + atomic-design level, `getComputedStyle` tokens, CSS custom properties, text/labels, bounding box / flex-grid layout, and interaction state (with linked default/hover/active shots when captured). In `--local` mode, `{name}.element.json` sidecars sit next to each PNG.

After shots are written, capture runs a **coverage validation** against the taxonomy in `src/data/capture-process.ts` (surface / component / state / structure / source). Thin = fewer than 20 unique screenshots. Results land in `coverage.json` and are printed in the capture summary; re-run anytime with `npm run validate:ui`.

Images land under `public/products/[slug]/` (capture workspace) with a `manifest.json` + `insights.json`, then sync to the database. When `BLOB_READ_WRITE_TOKEN` is set, capture also **uploads binaries to Vercel Blob (private)** under `products/[slug]/` and rewrites `products.screenshots[].src` to `/api/blob/products/...` proxy URLs for production. Live captures are **PNG at 2× device scale**; fallback assets may still be JPEG.

```bash
# One-time: private Blob store (see storage:setup-screenshots)
npm run storage:setup-screenshots

# Backfill existing local captures → Blob + DB URL rewrite
npm run storage:sync-screenshots -- --slug=notion
npm run storage:sync-screenshots -- --all --limit=10
```

Local `public/products` stays for Playwright dedupe/validation; Blob is the deploy source of truth once synced. Prefer not committing large new image trees to git as the catalog grows.

See **[/process](/process)** for the capture taxonomy (cards, modals, menus, states, limits).

| Script | Purpose |
|--------|---------|
| `npm run db:push` | Push Drizzle schema to Supabase |
| `npm run db:seed` | Upsert all products from `src/data/` |
| `npm run db:setup-avatars` | Reminder: avatars use private Vercel Blob |
| `npm run db:setup-submissions` | Reminder: submissions use private Vercel Blob |
| `npm run storage:setup-screenshots` | Reminder: create private Vercel Blob store |
| `npm run storage:sync-screenshots` | Upload local captures → Blob and rewrite DB `src` |
| `npm run db:collect-screenshots` | Collect OG/marketing gallery images into Supabase |
| `npm run db:enrich-screenshots` | Prefer docs UI images over OG cards |
| `npm run capture:install` | Install Playwright Chromium |
| `npm run capture:ui -- --slug=…` | Capture one product (fallback + coverage + Storage upload) |
| `npm run capture:ui -- --all` | Capture every product |
| `npm run validate:ui -- --slug=…` | Taxonomy coverage report for an already-captured product |
| `npm run validate:ui -- --all` | Coverage report for every captured product |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:generate` | Generate SQL migrations |
| `npm run db:url` | Encode and write `DATABASE_URL` (pooler) |