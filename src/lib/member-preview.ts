import { cookies } from "next/headers";

export const MEMBER_PREVIEW_COOKIE = "pb_member_preview";

export async function isMemberPreviewActive(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(MEMBER_PREVIEW_COOKIE)?.value === "1";
}
