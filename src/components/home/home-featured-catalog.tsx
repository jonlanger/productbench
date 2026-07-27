import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/catalog/product-card";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts } from "@/data/queries";
import { assignBentoSizes } from "@/lib/bento-size";

const FEATURED_SLUGS = [
  "notion",
  "salesforce",
  "figma",
  "stripe-dashboard",
  "linear",
  "sap-s4hana",
  "spotify",
  "epic-hyperspace",
];

export async function HomeFeaturedCatalog() {
  const featured = await getFeaturedProducts(FEATURED_SLUGS);
  const bentoSizes = assignBentoSizes(featured);

  return (
    <section className="border-b border-border/70 py-16 sm:py-20">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
              Featured in the catalog
            </h2>
            <p className="text-base text-muted-foreground sm:text-lg">
              A cross-section of enterprise, consumer, industrial, and developer
              products — open any card for UX, workflows, and architecture detail.
            </p>
          </div>
          <Button render={<Link href="/catalog" />} variant="outline">
            View all products
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="grid auto-rows-[minmax(200px,auto)] grid-flow-dense grid-cols-1 gap-3 sm:auto-rows-[minmax(210px,auto)] sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              bentoSize={bentoSizes.get(product.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
