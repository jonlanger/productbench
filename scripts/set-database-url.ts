/**
 * Usage: npm run db:url -- 'your-new-password'
 * Writes an encoded pooler DATABASE_URL into .env.local
 */
import { readFileSync, writeFileSync, existsSync } from "fs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run db:url -- 'your-new-password'");
  process.exit(1);
}

const projectRef = "iwwivpbivxbugpfrfdjh";
const region = "ca-central-1";
const databaseUrl =
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}` +
  `@aws-0-${region}.pooler.supabase.com:6543/postgres`;

const envPath = ".env.local";
if (!existsSync(envPath)) {
  console.error(".env.local not found");
  process.exit(1);
}

let env = readFileSync(envPath, "utf8");
if (/^DATABASE_URL=/m.test(env)) {
  env = env.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${databaseUrl}`);
} else {
  env = `DATABASE_URL=${databaseUrl}\n${env}`;
}

writeFileSync(envPath, env);
console.log("Updated DATABASE_URL in .env.local (pooler, password encoded).");
