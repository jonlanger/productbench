import { avatarBlobPathname, blobMediaUrl } from "./blob";
import type { AuthUser } from "./auth";

/** @deprecated Prefer avatarBlobPathname — storage is Vercel Blob. */
export const AVATARS_BUCKET = "avatars";

export function getUserAvatarUrl(
  user: AuthUser | null | undefined,
): string | null {
  if (!user?.imageUrl) return null;
  return user.imageUrl;
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
