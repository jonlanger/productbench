import type { User } from "@supabase/supabase-js";

import { avatarBlobPathname, blobMediaUrl } from "./blob";

/** @deprecated Prefer avatarBlobPathname — storage is Vercel Blob. */
export const AVATARS_BUCKET = "avatars";

export function getUserAvatarUrl(user: User | null | undefined): string | null {
  if (!user) return null;
  const url = user.user_metadata?.avatar_url;
  return typeof url === "string" && url.length > 0 ? url : null;
}

export function getUserInitials(email: string | null | undefined): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (local.slice(0, 2) || "?").toUpperCase();
}

export function avatarObjectPath(userId: string, fileName: string): string {
  return avatarBlobPathname(userId, fileName);
}

export function avatarMediaUrl(userId: string, fileName: string): string {
  return blobMediaUrl(avatarBlobPathname(userId, fileName));
}
