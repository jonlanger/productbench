"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCatalog } from "@/components/catalog/catalog-provider";
import { SearchBar } from "@/components/catalog/search-bar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Toggle } from "@/components/ui/toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCatalog = pathname === "/catalog";
  const showSearch = isHome || isCatalog;
  const {
    filters,
    setQuery,
    desktopFiltersOpen,
    setDesktopFiltersOpen,
    setMobileFiltersOpen,
    activeFilterCount,
  } = useCatalog();

  return (
    <header className="z-40 flex h-14 min-w-0 shrink-0 items-center gap-2 border-b border-border/80 bg-background/85 px-2 backdrop-blur-md sm:gap-3 sm:px-4">
      <SidebarTrigger className="shrink-0" />

      {isCatalog ? (
        <Toggle
          pressed={desktopFiltersOpen}
          onPressedChange={setDesktopFiltersOpen}
          variant="default"
          size="sm"
          className="hidden shrink-0 lg:inline-flex"
          aria-label={
            desktopFiltersOpen ? "Close filters" : "Open filters"
          }
        >
          {desktopFiltersOpen ? "Close Filters" : "Open Filters"}
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-foreground px-1.5 text-[10px] text-background tabular-nums">
              {activeFilterCount}
            </span>
          ) : null}
        </Toggle>
      ) : null}

      {showSearch ? (
        <div className="min-w-0 flex-1">
          <SearchBar
            value={filters.query}
            onChange={setQuery}
            compact
          />
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      {isCatalog ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="relative shrink-0 lg:hidden"
          onClick={() => setMobileFiltersOpen(true)}
          aria-label={
            activeFilterCount > 0
              ? `Open filters, ${activeFilterCount} active`
              : "Open filters"
          }
        >
          Open Filters
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-foreground px-1.5 text-[10px] text-background tabular-nums">
              {activeFilterCount > 9 ? "9+" : activeFilterCount}
            </span>
          ) : null}
        </Button>
      ) : null}

      <Button
        render={<Link href="/contribute" />}
        variant="ghost"
        size="sm"
        className="shrink-0"
      >
        Contribute
      </Button>
    </header>
  );
}
