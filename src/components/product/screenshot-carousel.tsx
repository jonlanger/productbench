"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ProductScreenshot,
  ProductScreenshotKind,
} from "@/data/types";
import { cn } from "@/lib/utils";

type ScreenshotCarouselProps = {
  title?: string;
  description?: string;
  screenshots: ProductScreenshot[];
  accent?: string;
  className?: string;
  kinds?: ProductScreenshotKind[];
};

const KIND_LABEL: Record<ProductScreenshotKind, string> = {
  homepage: "Homepage",
  product: "Product UI",
  component: "UI detail",
  docs: "Docs / help",
  marketing: "Marketing",
  technical: "Technical docs",
  supporting: "Admin / support",
};

export function ScreenshotCarousel({
  title = "Product screens",
  description,
  screenshots,
  accent,
  className,
  kinds,
}: ScreenshotCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });

  const items = useMemo(() => {
    if (!kinds || kinds.length === 0) return screenshots;
    return screenshots.filter((shot) =>
      kinds.includes(shot.kind ?? "marketing"),
    );
  }, [screenshots, kinds]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    function update() {
      if (!node) return;
      const max = node.scrollWidth - node.clientWidth;
      setCanScroll({
        prev: node.scrollLeft > 8,
        next: node.scrollLeft < max - 8,
      });

      const cards = [...node.querySelectorAll<HTMLElement>("[data-shot]")];
      if (cards.length === 0) return;
      const center = node.scrollLeft + node.clientWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const mid = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      });
      setActiveIndex(best);
    }

    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  function scrollByCard(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-shot]");
    const delta = (card?.offsetWidth ?? 320) + 16;
    node.scrollBy({ left: direction * delta, behavior: "smooth" });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-heading text-xl tracking-tight sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="tabular-nums">
            {activeIndex + 1} / {items.length}
          </Badge>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Previous screenshot"
            disabled={!canScroll.prev}
            onClick={() => scrollByCard(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Next screenshot"
            disabled={!canScroll.next}
            onClick={() => scrollByCard(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((shot, index) => (
          <figure
            key={`${shot.src}-${shot.title}-${index}`}
            data-shot
            className="group relative w-[min(100%,28rem)] shrink-0 snap-center overflow-hidden rounded-2xl border border-border/80 bg-card sm:w-[32rem]"
          >
            <div
              className="relative aspect-[16/10] overflow-hidden"
              style={{
                background: accent
                  ? `linear-gradient(145deg, ${accent}22, transparent 55%), oklch(0.97 0.01 240)`
                  : undefined,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.src}
                alt={shot.title}
                loading={index === 0 ? "eager" : "lazy"}
                className="size-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  const fallback = event.currentTarget.nextElementSibling;
                  if (fallback instanceof HTMLElement) {
                    fallback.hidden = false;
                  }
                }}
              />
              <div
                hidden
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                <ImageIcon className="size-8 opacity-50" />
                <span className="text-xs">Preview unavailable</span>
              </div>
              {shot.kind ? (
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
                >
                  {KIND_LABEL[shot.kind]}
                </Badge>
              ) : null}
            </div>
            <figcaption className="space-y-1 border-t border-border/70 px-4 py-3">
              <div className="text-sm font-medium">{shot.title}</div>
              {shot.caption ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {shot.caption}
                </p>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="flex justify-center gap-1.5">
        {items.map((shot, index) => (
          <button
            key={`dot-${shot.src}-${index}`}
            type="button"
            aria-label={`Go to ${shot.title}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === activeIndex
                ? "w-6 bg-foreground"
                : "w-1.5 bg-border hover:bg-muted-foreground/40",
            )}
            onClick={() => {
              const node = scrollerRef.current;
              const card = node?.querySelectorAll<HTMLElement>("[data-shot]")[
                index
              ];
              card?.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
              });
            }}
          />
        ))}
      </div>
    </section>
  );
}

export function ProductVisualGalleries({
  screenshots,
  accent,
}: {
  screenshots: ProductScreenshot[];
  accent?: string;
}) {
  if (!screenshots.length) return null;

  const homepage = screenshots.filter((s) => s.kind === "homepage");
  const product = screenshots.filter((s) =>
    ["product", "docs", "technical", "supporting"].includes(s.kind ?? ""),
  );
  const components = screenshots.filter((s) => s.kind === "component");
  const marketing = screenshots.filter((s) => s.kind === "marketing");

  return (
    <div className="mb-10 space-y-10">
      {homepage.length > 0 ? (
        <ScreenshotCarousel
          title="Homepage"
          description="Public marketing homepage — kept separate from in-product surfaces."
          screenshots={homepage}
          accent={accent}
          kinds={["homepage"]}
        />
      ) : null}
      {product.length > 0 ? (
        <ScreenshotCarousel
          title="Product surfaces"
          description="Full screens: search, detail, dashboards, and other primary flows."
          screenshots={product}
          accent={accent}
          kinds={["product", "docs", "technical", "supporting"]}
        />
      ) : null}
      {components.length > 0 ? (
        <ScreenshotCarousel
          title="UI details"
          description="Cards, modals, menus, empty states, and other component-level patterns."
          screenshots={components}
          accent={accent}
          kinds={["component"]}
        />
      ) : null}
      {marketing.length > 0 ? (
        <ScreenshotCarousel
          title="Marketing visuals"
          description="Hero and campaign imagery from the product site."
          screenshots={marketing}
          accent={accent}
          kinds={["marketing"]}
        />
      ) : null}
    </div>
  );
}
