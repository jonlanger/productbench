import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

/**
 * Account sign-in is intentionally off. The previous Supabase Auth host no
 * longer resolves; calling it from middleware/layout hung until 504.
 * Wire a new provider here before returning true.
 */
export function isAuthEnabled() {
  return false;
}

/** @deprecated Prefer `isAuthEnabled`. Always false while Auth stays disabled. */
export function hasSupabasePublicConfig() {
  return isAuthEnabled();
}

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — safe to ignore when middleware
          // refreshes sessions.
        }
      },
    },
  });
}
