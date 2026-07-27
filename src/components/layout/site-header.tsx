"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Filter,
  Menu,
  PanelLeft,
  PanelLeftClose,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useCatalog } from "@/components/catalog/catalog-provider";
import { SearchBar } from "@/components/catalog/search-bar";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/process", label: "Process" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
] as const;

type SiteHeaderProps = {
  account?: ReactNode;
};

export function SiteHeader({ account }: SiteHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCatalog = pathname === "/catalog";
  const showSearch = isHome || isCatalog;
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    filters,
    setQuery,
    desktopFiltersOpen,
    setDesktopFiltersOpen,
    setMobileFiltersOpen,
    activeFilterCount,
  } = useCatalog();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 sm:gap-2.5"
          aria-label="ProductBench home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Boxes className="size-4" />
          </span>
          <span
            className={cn(
              "font-heading text-lg tracking-tight",
              showSearch ? "hidden sm:inline" : "inline",
            )}
          >
            ProductBench
          </span>
        </Link>

        <NavigationMenu className="hidden shrink-0 md:flex" align="start">
          <NavigationMenuList>
            {NAV_LINKS.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  render={<Link href={link.href} />}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    pathname === link.href && "bg-muted",
                  )}
                >
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {isCatalog ? (
          <Toggle
            pressed={desktopFiltersOpen}
            onPressedChange={setDesktopFiltersOpen}
            variant="outline"
            size="lg"
            className="hidden shrink-0 lg:inline-flex"
            aria-label={
              desktopFiltersOpen ? "Collapse filters" : "Expand filters"
            }
          >
            {desktopFiltersOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeft className="size-4" />
            )}
            Filters
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
          <div className="ml-auto hidden md:block" />
        )}

        {isCatalog ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="relative shrink-0 sm:hidden"
              onClick={() => setMobileFiltersOpen(true)}
              aria-label={
                activeFilterCount > 0
                  ? `Open filters, ${activeFilterCount} active`
                  : "Open filters"
              }
            >
              <Filter className="size-4" />
              {activeFilterCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background tabular-nums">
                  {activeFilterCount > 9 ? "9+" : activeFilterCount}
                </span>
              ) : null}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="relative hidden shrink-0 sm:inline-flex lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
              aria-label="Open filters"
            >
              <Filter className="size-4" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-foreground px-1.5 text-[10px] text-background tabular-nums">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </>
        ) : null}

        <div
          className={cn(
            "hidden items-center md:flex",
            !showSearch && "ml-auto",
          )}
        >
          {account}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={cn(
            "shrink-0 md:hidden",
            !showSearch && !account && "ml-auto",
          )}
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>

      {mobileOpen ? (
        <nav
          id="mobile-nav"
          className="border-t border-border/70 px-3 py-3 sm:px-6 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                    pathname === link.href && "bg-muted",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {account ? (
              <li className="mt-2 border-t border-border/60 pt-2">{account}</li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
