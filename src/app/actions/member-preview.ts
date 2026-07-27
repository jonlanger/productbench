"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getViewer } from "@/lib/auth";
import { MEMBER_PREVIEW_COOKIE } from "@/lib/member-preview";

const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function requireAdmin() {
  const { isAdmin } = await getViewer();
  if (!isAdmin) {
    throw new Error("Only admins can change member preview.");
  }
}

export async function enableMemberPreview() {
  await requireAdmin();
  const cookieStore = await cookies();
  cookieStore.set(MEMBER_PREVIEW_COOKIE, "1", {
    path: "/",
    maxAge: PREVIEW_MAX_AGE,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function disableMemberPreview() {
  await requireAdmin();
  const cookieStore = await cookies();
  cookieStore.delete(MEMBER_PREVIEW_COOKIE);
  revalidatePath("/", "layout");
}
