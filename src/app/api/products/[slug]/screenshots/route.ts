import { NextResponse } from "next/server";

import { getVisibleProductBySlug } from "@/data/queries";
import type { ProductScreenshotKind } from "@/data/types";
import { getViewer } from "@/lib/auth";
import { isAuthEnabled } from "@/lib/auth-config";
import { GUEST_PREVIEW_COUNT } from "@/lib/gallery";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 60;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT)),
  );
  const kindsParam = searchParams.get("kinds");
  const kinds = kindsParam
    ? (kindsParam.split(",").filter(Boolean) as ProductScreenshotKind[])
    : null;

  const [product, { user }] = await Promise.all([
    getVisibleProductBySlug(slug),
    getViewer(),
  ]);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const all = product.screenshots ?? [];
  const filtered =
    kinds && kinds.length > 0
      ? all.filter((shot) => kinds.includes(shot.kind ?? "marketing"))
      : all;

  const unlockGallery = Boolean(user) || !isAuthEnabled();
  const visible = unlockGallery
    ? filtered
    : filtered.slice(0, GUEST_PREVIEW_COUNT);
  const items = visible.slice(offset, offset + limit);
  const nextOffset = offset + items.length;

  return NextResponse.json({
    items,
    total: visible.length,
    offset,
    limit,
    hasMore: nextOffset < visible.length,
    nextOffset,
    gated: !unlockGallery && filtered.length > GUEST_PREVIEW_COUNT,
  });
}
