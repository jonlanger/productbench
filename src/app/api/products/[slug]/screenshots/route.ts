import { NextResponse } from "next/server";

import { getVisibleProductBySlug } from "@/data/queries";
import type { ProductScreenshotKind } from "@/data/types";

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

  const product = await getVisibleProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const all = product.screenshots ?? [];
  const filtered =
    kinds && kinds.length > 0
      ? all.filter((shot) => kinds.includes(shot.kind ?? "marketing"))
      : all;

  const items = filtered.slice(offset, offset + limit);
  const nextOffset = offset + items.length;

  return NextResponse.json({
    items,
    total: filtered.length,
    offset,
    limit,
    hasMore: nextOffset < filtered.length,
    nextOffset,
  });
}
