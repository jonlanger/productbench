import type { User } from "@supabase/supabase-js";

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
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext === "jpeg"
      ? "jpg"
      : ext
    : "jpg";
  return `${userId}/avatar.${safeExt}`;
}
