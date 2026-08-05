import { del, get } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

import { getViewer } from "@/lib/auth";
import { BLOB_ACCESS, hasBlobConfig } from "@/lib/blob";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ pathname: string[] }>;
};

function isPublicReadPrefix(pathname: string): boolean {
  return (
    pathname.startsWith("products/") || pathname.startsWith("avatars/")
  );
}

async function resolvePathname(context: RouteContext): Promise<string | null> {
  const { pathname: parts } = await context.params;
  const pathname = parts.map(decodeURIComponent).join("/");
  if (!pathname || pathname.includes("..")) return null;
  return pathname;
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!hasBlobConfig()) {
    return NextResponse.json(
      { error: "Blob storage is not configured." },
      { status: 503 },
    );
  }

  const pathname = await resolvePathname(context);
  if (!pathname) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  if (!isPublicReadPrefix(pathname)) {
    if (pathname.startsWith("submissions/")) {
      const { user, actsAsAdmin } = await getViewer();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const ownerId = pathname.split("/")[1];
      if (!actsAsAdmin && ownerId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const ifNoneMatch = request.headers.get("if-none-match") ?? undefined;

  const result = await get(pathname, {
    access: BLOB_ACCESS,
    ifNoneMatch,
  });

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (result.statusCode === 304) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: result.blob.etag,
        "Cache-Control": result.blob.cacheControl,
      },
    });
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Cache-Control":
        result.blob.cacheControl || "public, max-age=31536000, immutable",
      ETag: result.blob.etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!hasBlobConfig()) {
    return NextResponse.json(
      { error: "Blob storage is not configured." },
      { status: 503 },
    );
  }

  const pathname = await resolvePathname(context);
  if (!pathname) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  const { user } = await getViewer();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isOwnAvatar = pathname.startsWith(`avatars/${user.id}/`);
  const isOwnSubmission = pathname.startsWith(`submissions/${user.id}/`);
  if (!isOwnAvatar && !isOwnSubmission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await del(pathname);
  } catch {
    // Missing object is fine when clearing alternate avatar extensions.
  }

  return NextResponse.json({ ok: true });
}
