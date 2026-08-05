"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import {
  ImagePlus,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { createScreenshotSubmission } from "@/app/actions/submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ScreenshotSubmissionItem } from "@/db/schema";
import {
  BLOB_ACCESS,
  blobMediaUrl,
  submissionBlobPathname,
} from "@/lib/blob";
import { isAuthEnabled } from "@/lib/auth-config";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 8 * 1024 * 1024;

type DraftShot = {
  key: string;
  kind: "product" | "component";
  title: string;
  caption: string;
  sourceUrl: string;
  previewUrl: string | null;
  storagePath: string | null;
  publicUrl: string | null;
  uploading: boolean;
};

type AddDetailsFormProps = {
  productId: string;
  productSlug: string;
  productName: string;
  userId: string;
};

function emptyDraft(): DraftShot {
  return {
    key: crypto.randomUUID(),
    kind: "product",
    title: "",
    caption: "",
    sourceUrl: "",
    previewUrl: null,
    storagePath: null,
    publicUrl: null,
    uploading: false,
  };
}

export function AddDetailsForm({
  productId,
  productSlug,
  productName,
  userId,
}: AddDetailsFormProps) {
  const router = useRouter();
  const [shots, setShots] = useState<DraftShot[]>([emptyDraft()]);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isAuthEnabled()) {
    return (
      <p className="rounded-2xl border border-border/80 bg-muted/30 px-6 py-8 text-sm text-muted-foreground">
        Uploads are unavailable while account auth is disabled.
      </p>
    );
  }

  function updateShot(key: string, patch: Partial<DraftShot>) {
    setShots((prev) =>
      prev.map((shot) => (shot.key === key ? { ...shot, ...patch } : shot)),
    );
  }

  async function uploadImage(key: string, file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      setMessage("Use JPG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage("Each image must be 8MB or smaller.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    updateShot(key, {
      previewUrl: localPreview,
      uploading: true,
      storagePath: null,
      publicUrl: null,
    });
    setMessage(null);

    try {
      const ext =
        file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
        ? ext === "jpeg"
          ? "jpg"
          : ext
        : "jpg";
      const path = submissionBlobPathname(
        userId,
        productSlug,
        `${crypto.randomUUID()}.${safeExt}`,
      );

      await upload(path, file, {
        access: BLOB_ACCESS,
        handleUploadUrl: "/api/blob/upload",
        contentType: file.type,
      });

      const publicUrl = blobMediaUrl(path);

      setShots((prev) =>
        prev.map((shot) => {
          if (shot.key !== key) return shot;
          return {
            ...shot,
            uploading: false,
            storagePath: path,
            publicUrl,
            previewUrl: publicUrl,
            title:
              shot.title.trim() ||
              file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          };
        }),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Upload failed. Try again.",
      );
      updateShot(key, {
        previewUrl: null,
        uploading: false,
        storagePath: null,
        publicUrl: null,
      });
    } finally {
      URL.revokeObjectURL(localPreview);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const items: ScreenshotSubmissionItem[] = [];
    for (const shot of shots) {
      if (shot.uploading) {
        setMessage("Wait for uploads to finish.");
        setPending(false);
        return;
      }
      if (!shot.publicUrl || !shot.storagePath) {
        setMessage("Upload an image for each row, or remove empty rows.");
        setPending(false);
        return;
      }
      if (!shot.title.trim()) {
        setMessage("Give each screenshot a title.");
        setPending(false);
        return;
      }
      items.push({
        title: shot.title.trim(),
        caption: shot.caption.trim() || undefined,
        kind: shot.kind,
        sourceUrl: shot.sourceUrl.trim() || undefined,
        storagePath: shot.storagePath,
        publicUrl: shot.publicUrl,
      });
    }

    const result = await createScreenshotSubmission({
      productId,
      productSlug,
      productName,
      items,
      note,
    });

    setPending(false);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/30 px-6 py-10">
        <ImagePlus className="size-8 text-foreground" />
        <h2 className="font-heading text-2xl tracking-tight">
          Submission received
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Thanks — an admin will review your screenshots for {productName}.
          Approved images are added to the product gallery.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/products/${productSlug}`)}
          >
            Back to product
          </Button>
          <Button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setShots([emptyDraft()]);
              setNote("");
            }}
          >
            Submit more
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        {shots.map((shot, index) => (
          <div
            key={shot.key}
            className="space-y-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Screenshot {index + 1}</p>
              {shots.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setShots((prev) => prev.filter((s) => s.key !== shot.key))
                  }
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <div className="space-y-2">
                <Label>Image</Label>
                <label className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 text-center text-xs text-muted-foreground transition-colors hover:bg-muted/50">
                  {shot.uploading ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : shot.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shot.previewUrl}
                      alt=""
                      className="size-full object-cover object-top"
                    />
                  ) : (
                    <>
                      <Upload className="size-5" />
                      Upload
                    </>
                  )}
                  <input
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void uploadImage(shot.key, file);
                    }}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`title-${shot.key}`}>Title</Label>
                  <Input
                    id={`title-${shot.key}`}
                    value={shot.title}
                    onChange={(event) =>
                      updateShot(shot.key, { title: event.target.value })
                    }
                    placeholder="e.g. Project board view"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={shot.kind}
                    onValueChange={(value) => {
                      if (value === "product" || value === "component") {
                        updateShot(shot.key, { kind: value });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product surface</SelectItem>
                      <SelectItem value="component">UI detail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`source-${shot.key}`}>Source URL</Label>
                  <Input
                    id={`source-${shot.key}`}
                    type="url"
                    value={shot.sourceUrl}
                    onChange={(event) =>
                      updateShot(shot.key, { sourceUrl: event.target.value })
                    }
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`caption-${shot.key}`}>Caption</Label>
                  <Textarea
                    id={`caption-${shot.key}`}
                    value={shot.caption}
                    onChange={(event) =>
                      updateShot(shot.key, { caption: event.target.value })
                    }
                    placeholder="What does this screen show?"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setShots((prev) => [...prev, emptyDraft()])}
      >
        <Plus className="size-4" />
        Add another screenshot
      </Button>

      <div className="space-y-2">
        <Label htmlFor="note">Note for reviewers (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Context about where these shots came from…"
          rows={3}
        />
      </div>

      {message ? (
        <p
          className="rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          "Submit for review"
        )}
      </Button>
    </form>
  );
}
