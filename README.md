# ProductBench

Research catalog of enterprise, consumer, and industrial software — UX patterns, workflows, tech stacks, and product architecture.

## Stack

- Next.js (App Router)
- Supabase Postgres (via Drizzle ORM)
- Supabase client ready for Storage (screenshots)

Without `DATABASE_URL`, the app falls back to the TypeScript seed catalog in `src/data/`.

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

1. Open [Supabase](https://supabase.com/dashboard) and create (or select) a project.
2. Go to **Project Settings → Database** and copy the **connection string**.
   - App runtime: use the **Transaction pooler** URI (port `6543`).
   - Schema push: if `db:push` fails on the pooler, temporarily use the **direct** URI (port `5432`).
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public** key.

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_EMAILS=you@example.com
```

`ADMIN_EMAILS` is a comma-separated allowlist. Those accounts see the full catalog (including products with `is_public = false`). Guests and non-admin accounts only see the public set (the current ~50 products).

Enable **Email** auth in the Supabase dashboard (**Authentication → Providers**). Add your site URL and `/auth/callback` under **Authentication → URL Configuration**.

### 4. Push schema and seed

```bash
npm run db:push
npm run db:seed
npm run db:setup-avatars
npm run db:setup-submissions
```

`db:setup-avatars` creates a public Supabase Storage bucket for profile photos (used on `/account`).
`db:setup-submissions` creates storage for user-submitted product screenshots (reviewed at `/admin/submissions`).

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Screenshots

Preferred path is Playwright live UI capture. When a site is bot-blocked or the live run is thin (fewer than 14 shots), capture automatically runs a **web fallback** chain:

1. Curated docs/help/technical pages (`src/data/visual-sources.ts`) → download UI images
2. Open Graph / Twitter meta images from the homepage
3. thum.io live homepage snapshot (last resort for live marketing)
4. Wayback Machine archived page images / snapshot
5. YouTube posters + auto frame stills (`0–3.jpg`) when `youtube` URLs are curated
6. Apple App Store screenshots when `appStoreId` is curated

```bash
# Legacy standalone scrapers (still useful for marketing-only enrichment)
npm run db:collect-screenshots
npm run db:enrich-screenshots

# Preferred: Playwright live UI capture (+ automatic fallback)
npm run capture:install
npm run capture:ui -- --slug=notion
npm run capture:ui -- --all                 # every product
npm run capture:ui -- --all --limit=5       # smoke test
```

Playwright loads every catalog product (from Supabase when `DATABASE_URL` is set, otherwise seed data). Each product gets a **generic** playbook (homepage, card crop, account menu, sign-in, supporting docs URLs). Products with custom flows can ship a richer override — Airbnb is the first.

Each run also extracts **live insights** (nav labels, CTAs, headings, tech/pattern signals) into `capture_insights`, and soft-merges candidates into features / UX patterns / platforms / metrics without wiping curated seed copy.

Images land under `public/products/[slug]/` with a `manifest.json` + `insights.json`, then sync to the database.

See **[/process](/process)** for the capture taxonomy (cards, modals, menus, states, limits).

| Script | Purpose |
|--------|---------|
| `npm run db:push` | Push Drizzle schema to Supabase |
| `npm run db:seed` | Upsert all products from `src/data/` |
| `npm run db:setup-avatars` | Create public Storage bucket + RLS for profile photos |
| `npm run db:setup-submissions` | Create Storage bucket + RLS for screenshot submissions |
| `npm run db:collect-screenshots` | Collect OG/marketing gallery images into Supabase |
| `npm run db:enrich-screenshots` | Prefer docs UI images over OG cards |
| `npm run capture:install` | Install Playwright Chromium |
| `npm run capture:ui -- --slug=…` | Capture one product (with web fallback) |
| `npm run capture:ui -- --all` | Capture every product |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:generate` | Generate SQL migrations |
| `npm run db:url` | Encode and write `DATABASE_URL` (pooler) |