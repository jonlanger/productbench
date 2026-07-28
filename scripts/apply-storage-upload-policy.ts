import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

async function main() {
  const apply = process.argv.includes("--apply");
  const remove = process.argv.includes("--remove");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  const file = remove
    ? "remove-storage-upload-policy.sql"
    : "temp-storage-upload-policy.sql";
  const statement = readFileSync(
    resolve(process.cwd(), "scripts/sql", file),
    "utf8",
  );

  const client = postgres(url, { prepare: false, max: 1, ssl: "require" });
  try {
    await client.unsafe(statement);
    console.log(
      remove
        ? "Removed temporary Storage upload policies."
        : "Applied temporary Storage upload policies (publishable-key uploads).",
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
