import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }

  const sqlPath = resolve(
    process.cwd(),
    "scripts/sql/setup-avatars-storage.sql",
  );
  const statement = readFileSync(sqlPath, "utf8");

  const client = postgres(url, { prepare: false, max: 1 });
  try {
    await client.unsafe(statement);
    console.log("Avatars storage bucket and policies are ready.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
