"use client";

import { RotateCcw } from "lucide-react";

import { useCatalog } from "@/components/catalog/catalog-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import type {
  FilterState,
  Platform,
  PricingModel,
  ProductCategory,
  SortOption,
  UxDensity,
} from "@/data/types";
import {
  CATEGORIES,
  DENSITIES,
  PLATFORMS,
  PRICING,
  SEGMENTS,
  SORT_OPTIONS,
  formatLabel,
} from "@/lib/filters";

type FilterSidebarProps = {
  filters: FilterState;
  onChange: (next: FilterState) => void;
};

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const { facets, defaultFilters, activeFilterCount } = useCatalog();
  const active = activeFilterCount;
  const { pageCountBounds, industries, techStack, features } = facets;

  function toggleArrayItem<K extends keyof FilterState>(
    key: K,
    value: FilterState[K] extends Array<infer U> ? U : never,
  ) {
    const current = filters[key] as unknown[];
    const exists = current.includes(value);
    const next = exists
      ? current.filter((item) => item !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  }

  return (
    <aside className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 pb-3">
        <div>
          <h2 className="font-heading text-sm font-medium tracking-tight">
            Filters
          </h2>
          {active > 0 ? (
            <p className="text-xs text-muted-foreground">{active} active</p>
          ) : (
            <p className="text-xs text-muted-foreground">Refine the catalog</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={active === 0 && filters.sort === defaultFilters.sort}
          onClick={() => onChange(defaultFilters)}
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)] pr-3">
        <div className="space-y-6 pb-8">
          <FilterGroup title="Sort by">
            <Select
              value={filters.sort}
              onValueChange={(value) => {
                if (!value) return;
                onChange({ ...filters, sort: value as SortOption });
              }}
            >
              <SelectTrigger id="catalog-sort" className="w-full">
                <SelectValue placeholder="Sort products" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterGroup>

          <Separator />

          <FilterGroup title="Category">
            {CATEGORIES.map((category) => (
              <CheckRow
                key={category}
                id={`cat-${category}`}
                label={formatLabel(category)}
                checked={filters.categories.includes(category)}
                onCheckedChange={() =>
                  toggleArrayItem("categories", category as ProductCategory)
                }
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="Segment">
            {SEGMENTS.map((segment) => (
              <CheckRow
                key={segment}
                id={`seg-${segment}`}
                label={segment}
                checked={filters.segments.includes(segment)}
                onCheckedChange={() => toggleArrayItem("segments", segment)}
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="Platform">
            {PLATFORMS.map((platform) => (
              <CheckRow
                key={platform}
                id={`plat-${platform}`}
                label={formatLabel(platform)}
                checked={filters.platforms.includes(platform)}
                onCheckedChange={() =>
                  toggleArrayItem("platforms", platform as Platform)
                }
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="Pricing">
            {PRICING.map((pricing) => (
              <CheckRow
                key={pricing}
                id={`price-${pricing}`}
                label={formatLabel(pricing)}
                checked={filters.pricing.includes(pricing)}
                onCheckedChange={() =>
                  toggleArrayItem("pricing", pricing as PricingModel)
                }
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="UX density">
            {DENSITIES.map((density) => (
              <CheckRow
                key={density}
                id={`density-${density}`}
                label={formatLabel(density)}
                checked={filters.density.includes(density)}
                onCheckedChange={() =>
                  toggleArrayItem("density", density as UxDensity)
                }
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="Page count">
            <div className="space-y-3 px-0.5">
              <Slider
                min={pageCountBounds.min}
                max={pageCountBounds.max}
                step={10}
                value={filters.pageCountRange}
                onValueChange={(value) =>
                  onChange({
                    ...filters,
                    pageCountRange: value as [number, number],
                  })
                }
              />
              <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>{filters.pageCountRange[0]}</span>
                <span>{filters.pageCountRange[1]}</span>
              </div>
            </div>
          </FilterGroup>

          <Separator />

          <FilterGroup title="Industry">
            {industries.map((industry) => (
              <CheckRow
                key={industry}
                id={`ind-${industry}`}
                label={industry}
                checked={filters.industries.includes(industry)}
                onCheckedChange={() => toggleArrayItem("industries", industry)}
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="Tech stack">
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((tech) => {
                const activeTech = filters.techStack.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleArrayItem("techStack", tech)}
                    className="outline-none"
                  >
                    <Badge
                      variant={activeTech ? "default" : "outline"}
                      className="cursor-pointer font-normal"
                    >
                      {tech}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <Separator />

          <FilterGroup title="Features">
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {features.map((feature) => (
                <CheckRow
                  key={feature}
                  id={`feat-${feature}`}
                  label={feature}
                  checked={filters.features.includes(feature)}
                  onCheckedChange={() => toggleArrayItem("features", feature)}
                />
              ))}
            </div>
          </FilterGroup>
        </div>
      </ScrollArea>
    </aside>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
        {label}
      </Label>
    </div>
  );
}
