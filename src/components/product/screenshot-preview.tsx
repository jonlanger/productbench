"use client";

import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProductScreenshot } from "@/data/types";

type ScreenshotPreviewProps = {
  shot: ProductScreenshot | null;
  onClose: () => void;
};

export function ScreenshotPreview({ shot, onClose }: ScreenshotPreviewProps) {
  return (
    <Dialog.Root
      open={shot !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/55 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup className="relative flex h-[80vh] w-[80vw] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background text-foreground shadow-2xl outline-none transition duration-200 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
              <div className="min-w-0 space-y-0.5 pr-8">
                <Dialog.Title className="truncate font-heading text-base font-medium tracking-tight">
                  {shot?.title ?? "Screenshot"}
                </Dialog.Title>
                {shot?.caption ? (
                  <Dialog.Description className="line-clamp-2 text-sm text-muted-foreground">
                    {shot.caption}
                  </Dialog.Description>
                ) : (
                  <Dialog.Description className="sr-only">
                    Full-size product screenshot preview
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-3 right-3"
                    aria-label="Close preview"
                  />
                }
              >
                <XIcon className="size-4" />
              </Dialog.Close>
            </div>

            <div className="relative min-h-0 flex-1 bg-muted/30">
              {shot ? (
                <Image
                  src={shot.src}
                  alt={shot.title}
                  fill
                  sizes="80vw"
                  className="object-contain"
                  priority
                />
              ) : null}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
