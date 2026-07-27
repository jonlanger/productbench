import type { Metadata } from "next";

import { CatalogView } from "@/components/catalog/catalog-view";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "Browse and filter enterprise, consumer, and industrial software by UX patterns, workflows, and tech stacks.",
};

export default function CatalogPage() {
  return <CatalogView />;
}
