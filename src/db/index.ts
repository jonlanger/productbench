import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase Postgres connection string to .env.local.",
    );
  }

  const client = postgres(url, {
    prepare: false,
    max: 10,
    // Supabase (and most hosted Postgres) require TLS
    ssl: "require",
  });

  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as {
  productbenchDb?: ReturnType<typeof createDb>;
};

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase Postgres connection string to .env.local.",
    );
  }

  if (!globalForDb.productbenchDb) {
    globalForDb.productbenchDb = createDb();
  }

  return globalForDb.productbenchDb;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}
