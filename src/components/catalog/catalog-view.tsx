"use client";

import { useMemo } from "react";
import { PackageOpen } from "lucide-react";

import { useCatalog } from "@/components/catalog/catalog-provider";
import {
  CatalogLoadMore,
  usePaginatedList,
} from "@/components/catalog/catalog-load-more";
import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { ProductCard } from "@/components/catalog/product-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { assignBentoSizes } from "@/lib/bento-size";
import { getCatalogHeading } from "@/lib/product-search";
import { cn } from "@/lib/utils";

export function CatalogView() {
  const {
    filters,
    setFilters,
    results,
    products,
    resetFilters,
    desktopFiltersOpen,
    mobileFiltersOpen,
    setMobileFiltersOpen,
  } = useCatalog();

  const { title, description } = getCatalogHeading(filters.query);
  const { visible, hasMore, loadMore, shown, total } = usePaginatedList(results);
  const bentoSizes = useMemo(() => assignBentoSizes(visible), [visible]);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1">
      <aside
        className={cn(
          "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-hidden border-r border-border/70 transition-[width] duration-300 ease-out lg:block",
          desktopFiltersOpen ? "w-72 xl:w-80" : "w-0 border-r-0",
        )}
        aria-hidden={!desktopFiltersOpen}
      >
        <div
          className={cn(
            "h-full w-72 px-4 py-6 transition-opacity duration-200 xl:w-80 xl:px-6",
            desktopFiltersOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <FilterSidebar filters={filters} onChange={setFilters} />
        </div>
      </aside>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm p-4 lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <FilterSidebar filters={filters} onChange={setFilters} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 space-y-2 sm:mb-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1.5">
              <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              {results.length === products.length
                ? `${products.length} product${products.length === 1 ? "" : "s"}`
                : `${results.length} of ${products.length} products`}
            </p>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-20 text-center">
            <PackageOpen className="mb-3 size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg">No products match</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try clearing filters or broadening your search across categories,
              tech stacks, and UX patterns.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={resetFilters}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "grid grid-flow-dense gap-3 sm:gap-4",
                "grid-cols-1 auto-rows-[minmax(200px,auto)]",
                "sm:grid-cols-2 sm:auto-rows-[minmax(210px,auto)]",
                "xl:grid-cols-3 xl:auto-rows-[minmax(220px,auto)]",
                "2xl:grid-cols-4",
                !desktopFiltersOpen &&
                  "lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
              )}
            >
              {visible.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  bentoSize={bentoSizes.get(product.id)}
                />
              ))}
            </div>
            <CatalogLoadMore
              hasMore={hasMore}
              shown={shown}
              total={total}
              onLoadMore={loadMore}
            />
          </>
        )}
      </div>
    </div>
  );
}
