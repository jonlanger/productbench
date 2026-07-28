/**
 * Service-role Supabase client for capture/sync scripts.
 * Never import this into Next.js client bundles.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function hasStorageUploadConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

/** Prefer service role; fall back to publishable key when upload policies allow it. */
export function createStorageUploadClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const key = serviceKey ?? publishableKey;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and a Supabase API key for Storage uploads.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** @deprecated Use createStorageUploadClient */
export function createServiceRoleClient(): SupabaseClient {
  return createStorageUploadClient();
}
