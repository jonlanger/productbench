import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { unstable_rethrow } from "next/navigation";

import { isMemberPreviewActive } from "@/lib/member-preview";
import { createClient, hasSupabasePublicConfig } from "@/lib/supabase/server";

export type Viewer = {
  user: User | null;
  /** Signed-in email is on ADMIN_EMAILS */
  isAdmin: boolean;
  /** Admin is previewing the member experience */
  isMemberPreview: boolean;
  /** Use for catalog + nav visibility (false while member preview is on) */
  actsAsAdmin: boolean;
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
    return { user: null, isAdmin: false, isMemberPreview: false, actsAsAdmin: false };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAdmin = isAdminEmail(user?.email);
    const isMemberPreview = isAdmin ? await isMemberPreviewActive() : false;

    return {
      user,
      isAdmin,
      isMemberPreview,
      actsAsAdmin: isAdmin && !isMemberPreview,
    };
  } catch (error) {
    // Next throws when cookies() is used during static generation — rethrow
    // so the route opts into dynamic rendering instead of baking a guest page.
    unstable_rethrow(error);
    console.error("[getViewer] failed to resolve auth session.", error);
    return { user: null, isAdmin: false, isMemberPreview: false, actsAsAdmin: false };
  }
});
