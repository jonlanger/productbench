import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

/** @deprecated Prefer `@/lib/auth-config`. */
export function isAuthEnabled() {
  return clerkAuthEnabled();
}

/** @deprecated Prefer `isAuthEnabled`. */
export function hasSupabasePublicConfig() {
  return clerkAuthEnabled();
}

/** @deprecated Supabase Auth is unused — product auth is Clerk. */
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
