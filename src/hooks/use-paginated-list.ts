"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const CATALOG_PAGE_SIZE = 30;

export function usePaginatedList<T>(items: T[], pageSize = CATALOG_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Reset when the underlying list changes (search, filters, sort).
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const visible = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + pageSize, items.length));
  }, [items.length, pageSize]);

  return {
    visible,
    hasMore,
    loadMore,
    total: items.length,
    shown: visible.length,
  };
}
