"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { ProductScreenshot } from "@/data/types";
import { cn } from "@/lib/utils";

type ScreenshotImageProps = {
  shot: ProductScreenshot;
  eager?: boolean;
  root?: Element | null;
  rootMargin?: string;
  className?: string;
};

export function ScreenshotImage({
  shot,
  eager = false,
  root = null,
  rootMargin = "320px",
  className,
}: ScreenshotImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { root, rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, root, rootMargin]);

  const width = shot.width && shot.width > 0 ? shot.width : 1280;
  const height = shot.height && shot.height > 0 ? shot.height : 800;

  return (
    <div ref={ref} className={cn("relative size-full", className)}>
      {shouldLoad ? (
        <Image
          src={shot.src}
          alt={shot.title}
          width={width}
          height={height}
          sizes="(max-width: 640px) 100vw, 32rem"
          className="size-full object-cover object-top transition duration-500"
          priority={eager}
        />
      ) : (
        <div className="size-full animate-pulse bg-muted/60" aria-hidden />
      )}
    </div>
  );
}
