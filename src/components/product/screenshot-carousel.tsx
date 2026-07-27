"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreenshotImage } from "@/components/product/screenshot-image";
import type {
  ProductScreenshot,
  ProductScreenshotKind,
} from "@/data/types";
import { cn } from "@/lib/utils";

const RENDER_WINDOW = 3;
const SCREENSHOT_PAGE_SIZE = 20;

type ScreenshotCarouselProps = {
  title?: string;
  description?: string;
  screenshots: ProductScreenshot[];
  accent?: string;
  className?: string;
  kinds?: ProductScreenshotKind[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
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
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: ScreenshotCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollRoot, setScrollRoot] = useState<Element | null>(null);
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

      if (
        hasMore &&
        onLoadMore &&
        !loadingMore &&
        node.scrollLeft >= max - 240
      ) {
        onLoadMore();
      }
    }

    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [hasMore, items.length, loadingMore, onLoadMore]);

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
            {hasMore ? "+" : ""}
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
            disabled={!canScroll.next && !hasMore}
            onClick={() => scrollByCard(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={(node) => {
          scrollerRef.current = node;
          setScrollRoot(node);
        }}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((shot, index) => {
          const inWindow = Math.abs(index - activeIndex) <= RENDER_WINDOW;
          return (
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
                {inWindow ? (
                  <ScreenshotImage
                    shot={shot}
                    eager={index === 0}
                    root={scrollRoot}
                    className="transition duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div
                    className="size-full animate-pulse bg-muted/50"
                    aria-hidden
                  />
                )}
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
                {shot.playbookStep || shot.capturedAt ? (
                  <p className="text-[11px] text-muted-foreground/80">
                    {[shot.playbookStep, shot.capturedAt?.slice(0, 10)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {items.length <= 24 ? (
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
      ) : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? "Loading screenshots…" : "Load more screenshots"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

type PaginatedGallerySectionProps = {
  slug: string;
  kinds: ProductScreenshotKind[];
  initialItems: ProductScreenshot[];
  total: number;
  title: string;
  description: string;
  accent?: string;
};

function PaginatedGallerySection({
  slug,
  kinds,
  initialItems,
  total,
  title,
  description,
  accent,
}: PaginatedGallerySectionProps) {
  const [items, setItems] = useState(initialItems);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMore = items.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        offset: String(items.length),
        limit: String(SCREENSHOT_PAGE_SIZE),
        kinds: kinds.join(","),
      });
      const response = await fetch(
        `/api/products/${slug}/screenshots?${params.toString()}`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as {
        items: ProductScreenshot[];
        hasMore: boolean;
      };
      setItems((current) => {
        const seen = new Set(current.map((shot) => shot.src));
        const merged = [...current];
        for (const shot of data.items) {
          if (seen.has(shot.src)) continue;
          seen.add(shot.src);
          merged.push(shot);
        }
        return merged;
      });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, items.length, kinds, loadingMore, slug]);

  if (items.length === 0) return null;

  return (
    <ScreenshotCarousel
      title={title}
      description={description}
      screenshots={items}
      accent={accent}
      kinds={kinds}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
    />
  );
}

export function ProductVisualGalleries({
  slug,
  screenshots,
  accent,
}: {
  slug: string;
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
        <PaginatedGallerySection
          slug={slug}
          kinds={["homepage"]}
          initialItems={homepage.slice(0, SCREENSHOT_PAGE_SIZE)}
          total={homepage.length}
          title="Homepage"
          description="Public marketing homepage — kept separate from in-product surfaces."
          accent={accent}
        />
      ) : null}
      {product.length > 0 ? (
        <PaginatedGallerySection
          slug={slug}
          kinds={["product", "docs", "technical", "supporting"]}
          initialItems={product.slice(0, SCREENSHOT_PAGE_SIZE)}
          total={product.length}
          title="Product surfaces"
          description="Full screens: search, detail, dashboards, and other primary flows."
          accent={accent}
        />
      ) : null}
      {components.length > 0 ? (
        <PaginatedGallerySection
          slug={slug}
          kinds={["component"]}
          initialItems={components.slice(0, SCREENSHOT_PAGE_SIZE)}
          total={components.length}
          title="UI details"
          description="Cards, modals, menus, empty states, and other component-level patterns."
          accent={accent}
        />
      ) : null}
      {marketing.length > 0 ? (
        <PaginatedGallerySection
          slug={slug}
          kinds={["marketing"]}
          initialItems={marketing.slice(0, SCREENSHOT_PAGE_SIZE)}
          total={marketing.length}
          title="Marketing visuals"
          description="Hero and campaign imagery from the product site."
          accent={accent}
        />
      ) : null}
    </div>
  );
}
