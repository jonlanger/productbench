"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  submissionItemsToScreenshots,
} from "@/data/submissions";
import { getDb, hasDatabaseUrl } from "@/db";
import {
  productSubmissions,
  products,
  type ScreenshotSubmissionItem,
  type ScreenshotSubmissionPayload,
} from "@/db/schema";
import { getViewer } from "@/lib/auth";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function createScreenshotSubmission(input: {
  productId: string;
  productSlug: string;
  productName: string;
  items: ScreenshotSubmissionItem[];
  note?: string;
}): Promise<ActionResult> {
  const { user } = await getViewer();
  if (!user) {
    return { ok: false, error: "Sign in to submit product details." };
  }

  if (!hasDatabaseUrl()) {
    return { ok: false, error: "Database is not configured." };
  }

  if (!input.items.length) {
    return { ok: false, error: "Add at least one screenshot." };
  }

  for (const item of input.items) {
    if (!item.title.trim() || !item.publicUrl || !item.storagePath) {
      return {
        ok: false,
        error: "Each screenshot needs a title and uploaded image.",
      };
    }
    if (item.kind !== "product" && item.kind !== "component") {
      return { ok: false, error: "Choose Product surface or UI detail." };
    }
  }

  const payload: ScreenshotSubmissionPayload = {
    type: "screenshots",
    items: input.items.map((item) => ({
      ...item,
      title: item.title.trim(),
      caption: item.caption?.trim() || undefined,
      sourceUrl: item.sourceUrl?.trim() || undefined,
    })),
    note: input.note?.trim() || undefined,
  };

  const id = crypto.randomUUID();

  try {
    await getDb().insert(productSubmissions).values({
      id,
      productId: input.productId,
      productSlug: input.productSlug,
      productName: input.productName,
      submitterUserId: user.id,
      submitterEmail: user.email ?? null,
      status: "pending",
      payload,
    });
  } catch (error) {
    console.error("[createScreenshotSubmission]", error);
    return { ok: false, error: "Could not save submission. Try again." };
  }

  revalidatePath("/admin/submissions");
  revalidatePath("/account");
  return { ok: true, id };
}

export async function approveSubmission(
  submissionId: string,
  reviewNote?: string,
): Promise<ActionResult> {
  const { user, isAdmin } = await getViewer();
  if (!user || !isAdmin) {
    return { ok: false, error: "Admin access required." };
  }
  if (!hasDatabaseUrl()) {
    return { ok: false, error: "Database is not configured." };
  }

  try {
    const db = getDb();
    const [submission] = await db
      .select()
      .from(productSubmissions)
      .where(eq(productSubmissions.id, submissionId))
      .limit(1);

    if (!submission) {
      return { ok: false, error: "Submission not found." };
    }
    if (submission.status !== "pending") {
      return { ok: false, error: "Submission was already reviewed." };
    }
    if (submission.payload.type !== "screenshots") {
      return { ok: false, error: "Unsupported submission type." };
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, submission.productId))
      .limit(1);

    if (!product) {
      return { ok: false, error: "Product no longer exists." };
    }

    const incoming = submissionItemsToScreenshots(submission.payload.items);
    const existing = product.screenshots ?? [];
    const existingSrcs = new Set(existing.map((shot) => shot.src));
    const merged = [
      ...existing,
      ...incoming.filter((shot) => !existingSrcs.has(shot.src)),
    ];

    await db
      .update(products)
      .set({
        screenshots: merged,
        updatedAt: sql`now()`,
      })
      .where(eq(products.id, product.id));

    await db
      .update(productSubmissions)
      .set({
        status: "approved",
        reviewNote: reviewNote?.trim() || null,
        reviewedByEmail: user.email ?? null,
        reviewedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(productSubmissions.id, submissionId));

    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/catalog");
    revalidatePath("/admin/submissions");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("[approveSubmission]", error);
    return { ok: false, error: "Could not approve submission." };
  }
}

export async function rejectSubmission(
  submissionId: string,
  reviewNote?: string,
): Promise<ActionResult> {
  const { user, isAdmin } = await getViewer();
  if (!user || !isAdmin) {
    return { ok: false, error: "Admin access required." };
  }
  if (!hasDatabaseUrl()) {
    return { ok: false, error: "Database is not configured." };
  }

  try {
    const db = getDb();
    const [submission] = await db
      .select()
      .from(productSubmissions)
      .where(eq(productSubmissions.id, submissionId))
      .limit(1);

    if (!submission) {
      return { ok: false, error: "Submission not found." };
    }
    if (submission.status !== "pending") {
      return { ok: false, error: "Submission was already reviewed." };
    }

    await db
      .update(productSubmissions)
      .set({
        status: "rejected",
        reviewNote: reviewNote?.trim() || null,
        reviewedByEmail: user.email ?? null,
        reviewedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(productSubmissions.id, submissionId));

    revalidatePath("/admin/submissions");
    return { ok: true };
  } catch (error) {
    console.error("[rejectSubmission]", error);
    return { ok: false, error: "Could not reject submission." };
  }
}
