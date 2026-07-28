/**
 * Repair manifests that were overwritten by thin re-captures.
 * Rebuilds shot lists from on-disk images + any prior manifest metadata.
 *
 *   npx tsx scripts/repair-manifests.ts
 */
import fs from "fs";
import path from "path";

const root = "public/products";
let fixed = 0;
let ok = 0;

for (const slug of fs.readdirSync(root)) {
  const dir = path.join(root, slug);
  if (!fs.statSync(dir).isDirectory()) continue;

  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();

  const manPath = path.join(dir, "manifest.json");
  let shots: Array<Record<string, unknown>> = [];
  let insights: Record<string, unknown> | null = null;
  let capturedAt = new Date().toISOString();

  if (fs.existsSync(manPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manPath, "utf8")) as {
        shots?: Array<Record<string, unknown>>;
        screenshots?: Array<Record<string, unknown>>;
        insights?: Record<string, unknown>;
        capturedAt?: string;
      };
      shots = m.shots ?? m.screenshots ?? [];
      insights = m.insights ?? null;
      capturedAt = m.capturedAt ?? capturedAt;
    } catch {
      /* ignore */
    }
  }

  const byFile = new Map<string, Record<string, unknown>>();
  for (const s of shots) {
    const file = String(s.file ?? "");
    if (file) byFile.set(file, s);
  }

  for (const file of files) {
    if (byFile.has(file)) continue;
    byFile.set(file, {
      file,
      title: file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      caption: "Recovered from on-disk capture assets",
      kind: file.includes("fallback") ? "marketing" : "product",
      sourceUrl: "",
      capturedAt,
      playbookStep: file.includes("fallback") ? "web-fallback" : "recovered",
      unique: true,
    });
  }

  const existing = [...byFile.values()].filter((s) =>
    files.includes(String(s.file)),
  );

  if (existing.length === shots.length && existing.length === files.length) {
    ok += 1;
    continue;
  }

  const insightsPath = path.join(dir, "insights.json");
  if (!insights && fs.existsSync(insightsPath)) {
    try {
      insights = JSON.parse(fs.readFileSync(insightsPath, "utf8")) as Record<
        string,
        unknown
      >;
    } catch {
      /* ignore */
    }
  }
  if (insights) insights.screenshotCount = existing.length;

  fs.writeFileSync(
    manPath,
    JSON.stringify(
      {
        slug,
        capturedAt,
        shots: existing,
        insights: insights ?? undefined,
        repairedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  fixed += 1;
  console.log(
    `repaired ${slug}: manifest ${shots.length} → ${existing.length} (files ${files.length})`,
  );
}

console.log(`\nRepaired ${fixed}, already ok ${ok}`);
