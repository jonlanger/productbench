"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { FilterState, Product } from "@/data/types";
import {
  countActiveFilters,
  filterProducts,
  getDefaultFilters,
  getFilterFacets,
  type FilterFacets,
} from "@/lib/filters";

type CatalogContextValue = {
  products: Product[];
  facets: FilterFacets;
  defaultFilters: FilterState;
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  setQuery: (query: string) => void;
  resetFilters: () => void;
  results: Product[];
  activeFilterCount: number;
  desktopFiltersOpen: boolean;
  setDesktopFiltersOpen: (open: boolean) => void;
  toggleDesktopFilters: () => void;
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (open: boolean) => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) {
  const facets = useMemo(() => getFilterFacets(products), [products]);
  const defaultFilters = useMemo(
    () => getDefaultFilters(products),
    [products],
  );
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const results = useMemo(
    () => filterProducts(products, filters),
    [products, filters],
  );

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters, facets.pageCountBounds),
    [filters, facets.pageCountBounds],
  );

  const setQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);

  const toggleDesktopFilters = useCallback(() => {
    setDesktopFiltersOpen((open) => !open);
  }, []);

  const value = useMemo(
    () => ({
      products,
      facets,
      defaultFilters,
      filters,
      setFilters,
      setQuery,
      resetFilters,
      results,
      activeFilterCount,
      desktopFiltersOpen,
      setDesktopFiltersOpen,
      toggleDesktopFilters,
      mobileFiltersOpen,
      setMobileFiltersOpen,
    }),
    [
      products,
      facets,
      defaultFilters,
      filters,
      setQuery,
      resetFilters,
      results,
      activeFilterCount,
      desktopFiltersOpen,
      toggleDesktopFilters,
      mobileFiltersOpen,
    ],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}
