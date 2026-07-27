"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AVATARS_BUCKET,
  avatarObjectPath,
  getUserInitials,
} from "@/lib/avatar";
import {
  createClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type AvatarUploaderProps = {
  userId: string;
  email: string;
  avatarUrl: string | null;
};

export function AvatarUploader({
  userId,
  email,
  avatarUrl: initialUrl,
}: AvatarUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initials = getUserInitials(email);

  if (!hasSupabasePublicConfig()) {
    return (
      <p className="text-sm text-muted-foreground">
        Avatar upload requires Supabase configuration.
      </p>
    );
  }

  async function uploadFile(file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      setMessage("Use a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage("Image must be 2MB or smaller.");
      return;
    }

    setPending(true);
    setMessage(null);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const supabase = createClient();
      const path = avatarObjectPath(userId, file.name);

      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(path, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) {
        setMessage(uploadError.message);
        setPreviewUrl(initialUrl);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);

      const bustedUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: bustedUrl },
      });

      if (updateError) {
        setMessage(updateError.message);
        return;
      }

      setPreviewUrl(bustedUrl);
      setMessage("Profile photo updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Upload failed. Try again.",
      );
      setPreviewUrl(initialUrl);
    } finally {
      setPending(false);
      URL.revokeObjectURL(localPreview);
    }
  }

  async function removeAvatar() {
    if (!previewUrl && !initialUrl) return;

    setPending(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const extensions = ["jpg", "png", "webp", "gif"];
      await supabase.storage
        .from(AVATARS_BUCKET)
        .remove(extensions.map((ext) => `${userId}/avatar.${ext}`));

      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setPreviewUrl(null);
      setMessage("Profile photo removed.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not remove photo.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar className="size-20">
          {previewUrl ? <AvatarImage src={previewUrl} alt="" /> : null}
          <AvatarFallback className="bg-foreground text-background text-lg font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              {previewUrl ? "Change photo" : "Upload photo"}
            </Button>
            {previewUrl ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={removeAvatar}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP, or GIF · up to 2MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void uploadFile(file);
        }}
      />

      {message ? (
        <p
          className="text-sm text-muted-foreground"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
