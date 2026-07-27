import { desc, eq } from "drizzle-orm";
import { cache } from "react";

import { getDb, hasDatabaseUrl } from "@/db";
import {
  productSubmissions,
  type ProductSubmissionRow,
  type ScreenshotSubmissionItem,
  type SubmissionStatus,
} from "@/db/schema";
import { SUBMISSIONS_BUCKET } from "@/data/submission-constants";
import type { ProductScreenshot } from "@/data/types";

export { SUBMISSIONS_BUCKET };

export function submissionItemsToScreenshots(
  items: ScreenshotSubmissionItem[],
): ProductScreenshot[] {
  return items.map((item) => ({
    title: item.title,
    src: item.publicUrl,
    caption: item.caption,
    kind: item.kind,
    sourceUrl: item.sourceUrl,
  }));
}

export const getPendingSubmissions = cache(
  async (): Promise<ProductSubmissionRow[]> => {
    if (!hasDatabaseUrl()) return [];

    try {
      return await getDb()
        .select()
        .from(productSubmissions)
        .where(eq(productSubmissions.status, "pending"))
        .orderBy(desc(productSubmissions.createdAt));
    } catch (error) {
      console.error("[getPendingSubmissions] failed.", error);
      return [];
    }
  },
);

export const getSubmissionById = cache(
  async (id: string): Promise<ProductSubmissionRow | undefined> => {
    if (!hasDatabaseUrl()) return undefined;

    try {
      const [row] = await getDb()
        .select()
        .from(productSubmissions)
        .where(eq(productSubmissions.id, id))
        .limit(1);
      return row;
    } catch (error) {
      console.error(`[getSubmissionById] failed for "${id}".`, error);
      return undefined;
    }
  },
);

export async function countSubmissionsByStatus(
  status: SubmissionStatus,
): Promise<number> {
  if (!hasDatabaseUrl()) return 0;

  try {
    const rows = await getDb()
      .select({ id: productSubmissions.id })
      .from(productSubmissions)
      .where(eq(productSubmissions.status, status));
    return rows.length;
  } catch {
    return 0;
  }
}
