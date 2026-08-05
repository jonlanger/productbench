import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { unstable_rethrow } from "next/navigation";

import { isAuthEnabled } from "@/lib/auth-config";
import { isMemberPreviewActive } from "@/lib/member-preview";

export type AuthUser = {
  id: string;
  email: string | null;
  imageUrl: string | null;
};

export type Viewer = {
  user: AuthUser | null;
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

function primaryEmail(
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
): string | null {
  const primary = clerkUser.emailAddresses.find(
    (entry) => entry.id === clerkUser.primaryEmailAddressId,
  );
  return (
    primary?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null
  );
}

export const getViewer = cache(async (): Promise<Viewer> => {
  if (!isAuthEnabled()) {
    return {
      user: null,
      isAdmin: false,
      isMemberPreview: false,
      actsAsAdmin: false,
    };
  }

  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return {
        user: null,
        isAdmin: false,
        isMemberPreview: false,
        actsAsAdmin: false,
      };
    }

    const email = primaryEmail(clerkUser);
    const user: AuthUser = {
      id: clerkUser.id,
      email,
      imageUrl: clerkUser.imageUrl || null,
    };
    const isAdmin = isAdminEmail(email);
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
    return {
      user: null,
      isAdmin: false,
      isMemberPreview: false,
      actsAsAdmin: false,
    };
  }
});
