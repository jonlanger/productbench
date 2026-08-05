import { createBrowserClient } from "@supabase/ssr";

import { isAuthEnabled as clerkAuthEnabled } from "@/lib/auth-config";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, key };
}

/** @deprecated Supabase Auth is unused — product auth is Clerk. */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}

/** @deprecated Prefer `@/lib/auth-config`. */
export function isAuthEnabled() {
  return clerkAuthEnabled();
}

/** @deprecated Prefer `isAuthEnabled`. */
export function hasSupabasePublicConfig() {
  return clerkAuthEnabled();
}
