"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { usePaginatedList } from "@/hooks/use-paginated-list";

type CatalogLoadMoreProps = {
  hasMore: boolean;
  shown: number;
  total: number;
  onLoadMore: () => void;
};

export function CatalogLoadMore({
  hasMore,
  shown,
  total,
  onLoadMore,
}: CatalogLoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "480px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (!hasMore) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Showing all {total} product{total === 1 ? "" : "s"}.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="text-sm text-muted-foreground tabular-nums">
        Showing {shown} of {total} products
      </p>
      <Button type="button" variant="outline" onClick={onLoadMore}>
        Load more
      </Button>
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
    </div>
  );
}

export { usePaginatedList };
