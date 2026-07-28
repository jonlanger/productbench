"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LogIn } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreenshotImage } from "@/components/product/screenshot-image";
import type {
  ProductScreenshot,
  ProductScreenshotKind,
} from "@/data/types";
import { GUEST_PREVIEW_COUNT } from "@/lib/gallery";
import { groupScreenshotsByCategory } from "@/lib/screen-categories";
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
  /** When set, append a sign-in CTA card after the screenshots. */
  signInHref?: string;
  totalAvailable?: number;
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

function SignInGalleryCard({
  href,
  remaining,
  accent,
}: {
  href: string;
  remaining: number;
  accent?: string;
}) {
  const signUpHref = `${href}${href.includes("?") ? "&" : "?"}mode=sign-up`;

  return (
    <figure
      data-shot
      className="group relative flex w-[min(100%,28rem)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-border/80 bg-card sm:w-[32rem]"
    >
      <div
        className="relative flex aspect-[16/10] flex-col items-center justify-center gap-4 px-8 text-center"
        style={{
          background: accent
            ? `linear-gradient(145deg, ${accent}28, transparent 60%), oklch(0.96 0.012 240)`
            : "linear-gradient(145deg, oklch(0.94 0.02 240), oklch(0.97 0.008 240))",
        }}
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <LogIn className="size-5" aria-hidden />
        </span>
        <div className="space-y-2">
          <p className="font-heading text-xl tracking-tight">
            Sign in to see all
          </p>
          <p className="text-sm text-muted-foreground">
            {remaining > 0
              ? `${remaining} more screen${remaining === 1 ? "" : "s"} locked behind an account.`
              : "Create a free account to browse the full gallery."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" render={<Link href={href} />}>
            Sign in
          </Button>
          <Button
            size="sm"
            variant="outline"
            render={<Link href={signUpHref} />}
          >
            Sign up
          </Button>
        </div>
      </div>
      <figcaption className="space-y-1 border-t border-border/70 px-4 py-3">
        <div className="text-sm font-medium">Full product gallery</div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Members unlock every captured surface, UI detail, and marketing shot.
        </p>
      </figcaption>
    </figure>
  );
}

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
  signInHref,
  totalAvailable,
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

  const showSignInCard = Boolean(signInHref);
  const slideCount = items.length + (showSignInCard ? 1 : 0);
  const remaining = Math.max(
    0,
    (totalAvailable ?? items.length) - items.length,
  );

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
  }, [hasMore, slideCount, loadingMore, onLoadMore]);

  function scrollByCard(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-shot]");
    const delta = (card?.offsetWidth ?? 320) + 16;
    node.scrollBy({ left: direction * delta, behavior: "smooth" });
  }

  if (items.length === 0 && !showSignInCard) {
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
            {slideCount > 0 ? `${activeIndex + 1} / ${slideCount}` : "0"}
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
        {signInHref ? (
          <SignInGalleryCard
            href={signInHref}
            remaining={remaining}
            accent={accent}
          />
        ) : null}
      </div>

      {slideCount > 0 && slideCount <= 24 ? (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: slideCount }, (_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              aria-label={
                index < items.length
                  ? `Go to ${items[index]?.title ?? "screenshot"}`
                  : "Go to sign in"
              }
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

export function ProductSurfacesPreview({
  slug,
  screenshots,
  accent,
  signedIn = false,
  screenshotTotal,
}: {
  slug: string;
  screenshots: ProductScreenshot[];
  accent?: string;
  signedIn?: boolean;
  screenshotTotal?: number;
}) {
  if (!screenshots.length) return null;

  const total = screenshotTotal ?? screenshots.length;

  if (!signedIn) {
    const preview = screenshots.slice(0, GUEST_PREVIEW_COUNT);
    const signInHref = `/sign-in?next=${encodeURIComponent(`/products/${slug}`)}`;

    return (
      <div className="mb-10">
        <ScreenshotCarousel
          title="Product surfaces"
          description="A preview of captured screens. Open Screens for the full categorized gallery — or sign in to unlock everything."
          screenshots={preview}
          accent={accent}
          signInHref={signInHref}
          totalAvailable={total}
        />
      </div>
    );
  }

  const initial = screenshots.slice(0, SCREENSHOT_PAGE_SIZE);

  return (
    <div className="mb-10">
      <PaginatedSurfacesSection
        slug={slug}
        initialItems={initial}
        total={screenshots.length}
        accent={accent}
      />
    </div>
  );
}

function PaginatedSurfacesSection({
  slug,
  initialItems,
  total,
  accent,
}: {
  slug: string;
  initialItems: ProductScreenshot[];
  total: number;
  accent?: string;
}) {
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
      });
      const response = await fetch(
        `/api/products/${slug}/screenshots?${params.toString()}`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as {
        items: ProductScreenshot[];
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
  }, [hasMore, items.length, loadingMore, slug]);

  return (
    <ScreenshotCarousel
      title="Product surfaces"
      description="Captured screens from this product. Open the Screens tab for a categorized breakdown."
      screenshots={items}
      accent={accent}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
    />
  );
}

export function ProductScreensCatalog({
  screenshots,
  accent,
  signedIn = false,
  slug,
  screenshotTotal,
}: {
  screenshots: ProductScreenshot[];
  accent?: string;
  signedIn?: boolean;
  slug: string;
  screenshotTotal?: number;
}) {
  const groups = useMemo(
    () => groupScreenshotsByCategory(screenshots),
    [screenshots],
  );

  if (!screenshots.length) return null;

  const total = screenshotTotal ?? screenshots.length;
  const signInHref =
    !signedIn && total > screenshots.length
      ? `/sign-in?next=${encodeURIComponent(`/products/${slug}`)}`
      : undefined;
  const remaining = Math.max(0, total - screenshots.length);

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {groups.length} {groups.length === 1 ? "category" : "categories"} with
          captures
          {!signedIn && remaining > 0
            ? ` · ${remaining} more locked behind sign-in`
            : null}
          .
        </p>
      </div>

      {groups.map(({ category, screenshots: shots }, index) => (
        <ScreenshotCarousel
          key={category.id}
          title={category.title}
          description={category.description}
          screenshots={shots}
          accent={accent}
          signInHref={
            signInHref && index === groups.length - 1 ? signInHref : undefined
          }
          totalAvailable={
            signInHref && index === groups.length - 1 ? total : undefined
          }
        />
      ))}
    </div>
  );
}

/** @deprecated Prefer ProductSurfacesPreview / ProductScreensCatalog */
export function ProductVisualGalleries(
  props: Parameters<typeof ProductSurfacesPreview>[0],
) {
  return <ProductSurfacesPreview {...props} />;
}
