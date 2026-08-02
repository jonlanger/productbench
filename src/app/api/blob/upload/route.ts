import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { hasBlobConfig } from "@/lib/blob";
import { getViewer } from "@/lib/auth";

export const runtime = "nodejs";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasBlobConfig()) {
    return NextResponse.json(
      { error: "Blob storage is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const { user } = await getViewer();
        if (!user) {
          throw new Error("Not authenticated");
        }

        const isAvatar = pathname.startsWith(`avatars/${user.id}/`);
        const isSubmission = pathname.startsWith(`submissions/${user.id}/`);
        if (!isAvatar && !isSubmission) {
          throw new Error("Invalid upload path");
        }

        return {
          allowedContentTypes: [...IMAGE_TYPES],
          maximumSizeInBytes: isAvatar ? 2 * 1024 * 1024 : 8 * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: isAvatar,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async () => {
        // Client updates auth metadata / submission form state.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
