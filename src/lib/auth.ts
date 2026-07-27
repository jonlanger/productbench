import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient, hasSupabasePublicConfig } from "@/lib/supabase/server";

export type Viewer = {
  user: User | null;
  isAdmin: boolean;
};

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().has(email.trim().toLowerCase());
}

export const getViewer = cache(async (): Promise<Viewer> => {
  if (!hasSupabasePublicConfig()) {
    return { user: null, isAdmin: false };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      user,
      isAdmin: isAdminEmail(user?.email),
    };
  } catch (error) {
    console.error("[getViewer] failed to resolve auth session.", error);
    return { user: null, isAdmin: false };
  }
});
