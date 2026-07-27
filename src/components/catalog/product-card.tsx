"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Layers,
  MonitorSmartphone,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BentoSize, Product } from "@/data/types";
import { formatLabel } from "@/lib/filters";
import {
  bentoSizeClass,
  isLargeBentoSize,
} from "@/lib/bento-size";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  featured = false,
  bentoSize,
}: {
  product: Product;
  featured?: boolean;
  bentoSize?: BentoSize;
}) {
  const size = bentoSize ?? product.bentoSize;
  const isLarge = featured || isLargeBentoSize(size);

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn("group block min-h-0", bentoSizeClass[size])}
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden border-border/70 transition-all duration-300",
          "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]"
          style={{
            background: `radial-gradient(circle at top left, ${product.accent}, transparent 55%)`,
          }}
        />
        <CardHeader className="relative gap-2.5 sm:gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm sm:size-10"
                style={{ backgroundColor: product.accent }}
              >
                {product.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <CardTitle className="truncate text-base group-hover:underline group-hover:underline-offset-4">
                  {product.name}
                </CardTitle>
                <p className="truncate text-xs text-muted-foreground">
                  {product.company} · {product.founded}
                </p>
              </div>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{formatLabel(product.category)}</Badge>
            {product.segments.slice(0, 2).map((segment) => (
              <Badge key={segment} variant="outline">
                {segment}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="relative flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
          <p
            className={cn(
              "text-sm leading-relaxed text-muted-foreground",
              size === "hero" || size === "lg"
                ? "line-clamp-3 sm:line-clamp-4"
                : size === "wide" || size === "tall"
                  ? "line-clamp-2 sm:line-clamp-3"
                  : "line-clamp-2",
            )}
          >
            {isLarge ? product.description : product.tagline}
          </p>

          {(size === "hero" || size === "lg" || size === "tall") && (
            <div className="mt-auto hidden gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
              <MetaChip
                icon={<Layers className="size-3.5" />}
                label="Pages"
                value={String(product.metrics.pageCount)}
              />
              <MetaChip
                icon={<Workflow className="size-3.5" />}
                label="Workflows"
                value={String(product.workflows.length)}
              />
              <MetaChip
                icon={<MonitorSmartphone className="size-3.5" />}
                label="Platforms"
                value={String(product.platforms.length)}
              />
            </div>
          )}

          {size === "sm" || size === "md" ? (
            <div className="mt-auto flex flex-wrap gap-1">
              {product.techStack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : null}

          {(size === "hero" || size === "lg" || size === "wide") && (
            <div className="hidden flex-wrap gap-1.5 border-t border-border/60 pt-3 sm:flex">
              {product.ux.patterns.slice(0, 4).map((pattern) => (
                <Badge key={pattern} variant="outline" className="font-normal">
                  {pattern}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function MetaChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}
